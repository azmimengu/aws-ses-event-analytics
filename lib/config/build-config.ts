import * as cdk from '@aws-cdk/core';

interface Config {
  account: string;
  region: string;
  mongodbUri: string;
}

enum APP_ENV {
  DEV = 'dev',
  PROD = 'prod',
}

function getConfig(scope: cdk.App | cdk.Construct, appEnv: string) {
  const context = scope.node.tryGetContext(appEnv);

  const conf: Config = {
    account: context.account,
    region: context.region,
    mongodbUri: context.mongoDbUri,
  };

  return conf;
}

function getAppEnv() {
  const appEnv = process.env.APP_ENV;

  if (!appEnv) {
    return APP_ENV.DEV.toString();
  }

  if (Object.values(APP_ENV).includes(appEnv as APP_ENV)) {
    return appEnv;
  } else {
    throw new Error(`
      Unrecognized application environment stage supplied. \n
      Please supply one of [${APP_ENV.DEV}, ${APP_ENV.PROD}] valid variable.
    `);
  }

}

export {
  getConfig,
  getAppEnv,
}