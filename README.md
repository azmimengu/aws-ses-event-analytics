# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


Synth Function;
cdk synth SesSnsConsumerLambdaStack-dev
Deploy Function;
cdk deploy SesSnsConsumerLambdaStack-dev

Invoke locally;

sam-beta-cdk build SesSnsConsumerLambdaStack-dev/SesSnsConsumerLambdaFunction
sam-beta-cdk local invoke SesSnsConsumerLambdaStack-dev/SesSnsConsumerLambdaFunction

Invoke with an event;
sam-beta-cdk local invoke SesSnsConsumerLambdaStack-dev/SesSnsConsumerLambdaFunction --event lib/lambda/function-src/sample-events/email-delivery-queue.json