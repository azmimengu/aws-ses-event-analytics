import * as cdk from '@aws-cdk/core';
import * as sqs from '@aws-cdk/aws-sqs';
import * as sns from '@aws-cdk/aws-sns';
import * as iam from '@aws-cdk/aws-iam';
import * as snsSubscriptions from '@aws-cdk/aws-sns-subscriptions';

import {
  getAppEnv,
  getConfig
} from '../config';

export class SesEventSqsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();
    const conf = getConfig(scope, appEnv);

    const queue = new sqs.Queue(this, 'SesEvenQueue', {
      queueName: `${appEnv}-ses-event-queue`,
    });

    const sesEventTopic = sns.Topic.fromTopicArn(this, 'SesEventDestinationTopic', cdk.Fn.importValue(`SesEventDestinationTopicArn-${appEnv}`));

    const queueSubscription = new snsSubscriptions.SqsSubscription(queue);
    sesEventTopic.addSubscription(queueSubscription);

    const policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [ new iam.ServicePrincipal('sns.amazonaws.com') ],
      actions: [
        'sqs:SendMessage'
      ],
      resources: [
        `${queue.queueArn}:${conf.region}:${conf.account}:${queue.queueName}`
      ],
      conditions: {
        'ArnEquals': { 'aws:SourceArn': cdk.Fn.importValue(`SesEventDestinationTopicArn-${appEnv}`) }
      }
    });

    queue.addToResourcePolicy(policy);


    new cdk.CfnOutput(this, 'SesEvenQueueName', {
      value: queue.queueName,
      exportName: `SesEvenQueueName-${appEnv}`
    });

    new cdk.CfnOutput(this, 'SesEvenQueueArn', {
      value: queue.queueArn,
      exportName: `SesEvenQueueArn-${appEnv}`
    });

  }
}
