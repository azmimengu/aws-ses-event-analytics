const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { MailEventSchema } = require('./repository/schema');

const ssmClient = new SSMClient({ region: 'eu-central-1' });

let dbClient = null;

exports.handler = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("request:", JSON.stringify(event, undefined, 2));

  const funcEnv = process.env.ENV;
  const mongodbUri = process.env.MONGODB_URI;

  dbClient = await initiliazeDb(mongodbUri);

  await Promise.all(event.Records.map(async record => {
    const recordBody = JSON.parse(record.body);
    const sesEventMessage = JSON.parse(recordBody.Message);

    return handleEventMessage(sesEventMessage);
  }));

  // do not use SSM.
  // fetch function config from parameter store
  // if (!config) {
  //   config = await getConfigParameters(funcEnv);
  // }

  return {
    message: 'ok'
  };
};

const handleEventMessage = async (message) => {
  const event = message.eventType;

  if (event == 'Bounce') {
    await handleBounce(message);
  } else if (event == 'Click') {
    await handleClick(message);
  } else if (event == 'Complaint') {
    await handleComplaint(message);
  } else if (event == 'Delivery') {
    await handleDelivery(message);
  } else if (event == 'Open') {
    await handleOpen(message);
  } else if (event == 'Reject') {
    // do not handle this one
  } else if (event == 'Rendering Failure') {
    // this one too..
  } else if (event == 'Send') {
    await handleSend(message);
  } else {
    throw new Error('Unsupported event type received.');
  }
}

const handleDelivery = async (message) => {
  const addresses = message.mail.destination;

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const handleClick = async (message) => {
  const addresses = message.mail.destination;

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const handleOpen = async (message) => {
  const addresses = message.mail.destination;

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const handleSend = async (message) => {
  const addresses = message.mail.destination;

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const handleBounce = async (message) => {
  const addresses = message.bounce.bouncedRecipients.map(receipent => receipent.emailAddress);

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const handleComplaint = async (message) => {
  const addresses = message.complaint.complainedRecipients.map(receipent => receipent.emailAddress);

  for (var i = 0; i < addresses.length; i++) {
    await writeToDb(addresses[i], message);
  }
}

const writeToDb = async (user, payload) => {
  const tags = payload.mail.tags;
  var configuration_set = null;
  var source_ip = null;
  var from_domain = null;

  if (tags != undefined) {
    if ('ses:configuration-set' in tags) {
      configuration_set = tags['ses:configuration-set'].join(',');
    }
    if ('ses:source-ip' in tags) {
      source_ip = tags['ses:source-ip'].join(',');
    }
    if ('ses:from-domain' in tags) {
      from_domain = tags['ses:from-domain'].join(',');
    }
  }

  let eventType = payload.eventType;
  if (eventType == undefined) {
    eventType = payload.notificationType;
  }

  let data = {
    user,
    eventType: eventType,
    from: payload.mail.source,
    subject: payload.mail.commonHeaders ? payload.mail.commonHeaders.subject : undefined,
    messageId: payload.mail.messageId,
    timestamp: new Date(payload.mail.timestamp),
    configurationSet: configuration_set,
    sourceIp: source_ip,
    fromDomain: from_domain,
  };

  if (payload.click) {
    data['click'] = {
      ipAddress: payload.click.ipAddress,
      link: payload.click.link,
      linkTags: payload.click.linkTags,
      timestamp: new Date(payload.click.timestamp),
      userAgent: payload.click.userAgent,
    }
  }

  if (payload.open) {
    data['open'] = {
      ipAddress: payload.open.ipAddress,
      timestamp: new Date(payload.open.timestamp),
      userAgent: payload.open.userAgent,
    }
  }

  if (payload.bounce) {
    data['bounce'] = {
      bounceType: payload.bounce.bounceType,
      timestamp: new Date(payload.bounce.timestamp),
    }
  }

  if (payload.complaint) {
    data['complaint'] = {
      arrivalDate: payload.complaint.arrivalDate,
      complaintFeedbackType: payload.complaint.complaintFeedbackType,
      timestamp: new Date(payload.complaint.timestamp),
      userAgent: payload.complaint.userAgent,
    }
  }

  const mailEventModel = dbClient.model('MailEvent', MailEventSchema);

  try {
    const createdModel = await mailEventModel.create(data);
  } catch(e) {
    console.log('cannot create event record to db.', JSON.stringify(e));
    throw e;
  }
}

const getConfigParameters = async (funcEnv) => {

  const config = {};

  const command = new GetParametersByPathCommand({
    Path: `/${funcEnv}/ses-event-analytics/config/`
  });

  const paramsResult = await ssmClient.send(command);

  if (!paramsResult.Parameters) {
    throw new Error(`Config parameters cannot fetch for ${process.env.ENV} stage`);
  }

  for (let i = 0; i < paramsResult.Parameters.length; i++) {
    if (paramsResult.Parameters[i].Name === `/${funcEnv}/ses-event-analytics/config/MONGODB_URI`) {
      config['MONGODB_URI'] = paramsResult.Parameters[i].Value;
    }
  }

  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI config is required for this function');
  }

  return config;

}

const initiliazeDb = async (uri) => {
    if (dbClient == null) {
      dbClient = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
        bufferMaxEntries: 0,
        poolSize: 1,
        keepAlive: true,
        socketTimeoutMS: 2000000,
      });
      dbClient.model('MailEvent', MailEventSchema);
      console.log('Successfully connected to MongoDB Instance.');
      return dbClient;
    }
  return dbClient;
}
