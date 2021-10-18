#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { 
  getAppEnv,
  getConfig,
} from '../lib/config';
import {
  SesDestinationSnsStack,
} from '../lib/sns';
import {
  SesSnsConsumerLambdaStack
} from '../lib/lambda';
import {
  SesEventSqsStack
} from '../lib/sqs';

const app = new cdk.App();
const appEnv = getAppEnv();
const conf = getConfig(app, appEnv);

const env = { account: conf.account, region: conf.region };

new SesDestinationSnsStack(app, `SesEventDestinationSnsStack-${appEnv}`, { env });
new SesSnsConsumerLambdaStack(app, `SesSnsConsumerLambdaStack-${appEnv}`, { env });
new SesEventSqsStack(app, `SesEventQueueStack-${appEnv}`, { env });
