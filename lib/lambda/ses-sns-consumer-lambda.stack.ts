import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import {
  getAppEnv, getConfig
} from '../config';
import * as path from 'path';
import * as lambdaEventSource from '@aws-cdk/aws-lambda-event-sources';
import * as sqs from '@aws-cdk/aws-sqs';

export class SesSnsConsumerLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();
    const conf = getConfig(scope, appEnv);

    const func = new lambda.Function(this, 'SesSnsConsumerLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'function-src')),
      functionName: `ses-sns-consumer-${appEnv}-function`,
      environment: {
        ENV: appEnv,
        MONGODB_URI: conf.mongodbUri,
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
      timeout: cdk.Duration.seconds(15),
      description: `updated at ${new Date()}`
    });

    const lambdaVersion = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: `${appEnv}`,
      version: func.currentVersion,
    });
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnAlias).cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnAlias).cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    const sesEventQueue = sqs.Queue.fromQueueAttributes(this, 'SesEventQueue', {
      queueArn: cdk.Fn.importValue(`SesEvenQueueArn-${appEnv}`),
      queueName: cdk.Fn.importValue(`SesEvenQueueName-${appEnv}`)
    });

    const event = new lambdaEventSource.SqsEventSource(sesEventQueue, {
      batchSize: 10,
    });
    func.addEventSource(event);
    
  }
}
