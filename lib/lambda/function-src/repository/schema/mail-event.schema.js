const mongoose = require('mongoose');
const { Schema } = mongoose;

const MailEventSchema = new Schema({
  user: String,
  eventType: String,
  from: String,
  subject: String,
  messageId: String,
  timestamp: Date,
  configurationSet: String,
  sourceIp: String,
  fromDomain: String,
  click: {
    ipAddress: String,
    link: String,
    linkTags: { type: [String], default: undefined },
    timestamp: Date,
    userAgent: String
  },
  open: {
    ipAddress: String,
    timestamp: Date,
    userAgent: String,
  },
  bounce: {
    bounceType: String,
    timestamp: Date
  },
  complaint: {
    arrivalDate: Date,
    complaintFeedbackType: String,
    timestamp: Date,
    userAgent: String,
  }
}, {
  id: true,
  versionKey: false,
});

module.exports = {
  MailEventSchema,
}
