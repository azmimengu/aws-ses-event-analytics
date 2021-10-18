import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import {
  getAppEnv,
} from '../config';

export class SesDestinationSnsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();

    const topic = new sns.Topic(this, 'SesEventDestinationTopic', {
      topicName: `ses-events-destination-${appEnv}-topic`,
      displayName: 'SES Event Destination Topic',
    });

    new cdk.CfnOutput(this, 'SesEventDestinationTopicName', {
      value: topic.topicName,
      exportName: `SesEventDestinationTopicName-${appEnv}`
    });

    new cdk.CfnOutput(this, 'SesEventDestinationTopicArn', {
      value: topic.topicArn,
      exportName: `SesEventDestinationTopicArn-${appEnv}`
    });

  }
}
