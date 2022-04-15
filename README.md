# Connect a Phone Number to an Amazon Lex Chat Bot - NO CODE!

## Welcome to the Amazon Chime SDK

This is a simple example of how to provision telephony resources (e.g. a real phone number) and easily connect it to a chat bot that you can create with [Amazon Lex](https://aws.amazon.com/lex/).  

This example lets you build the chat bot totally separately from the telephony.  You deploy this "connector" and then build your bot.  You set the chat bot [ARN](https://docs.aws.amazon.com/general/latest/gr/aws-arns-and-namespaces.html) of the chat bot into the [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) and the telephony resources are automatically connected to it.

YOU DON'T NEED TO WRITE ANY CODE TO USE THIS.  You can just run this script and accept the default area code it chooses for a US based number, build an Amazon Lex Bot and run ONE simple command and your bot is attached to the phone number!  If you want a phone number in a different state or area code, one simple edit to one file is all it takes.  See below for more information.

## What is Amazon Chime SDK?

The Amazon Chime SDK is a set of real-time communications components that developers can use to quickly add messaging, audio, video, and screen sharing capabilities to their web or mobile applications.  There are three core parts of the SDK:

* Media Services (real-time audio and video, including SDKs for web and mobile)
* Messaging (server and client-side persistent messaging)
* Public Switched Telephone Network (PSTN) Audio capabilities (phone calls/telephony)

By using the Amazon Chime SDK, developers can help reduce the cost, complexity, and friction of creating and maintaining their own real-time communication infrastructure and services.  In addition, those applications can easily take advantage of advanced voice technologies enabled by machine learning.  [Amazon Voice Focus](https://aws.amazon.com/about-aws/whats-new/2020/08/amazon-chime-introduces-amazon-voice-focus-for-noise-suppression/) for PSTN provides deep learning based noise suppression to reduce unwanted noise on calls.  Use text-to-speech in your application through our native integration to [Amazon Polly](https://aws.amazon.com/polly/) or build real-time phone-call voice chat-bots using native integration with [Amazon Lex](https://aws.amazon.com/lex/).

## What is Amazon Chime SDK PSTN Audio?

With PSTN Audio, developers can build custom telephony applications using the agility and operational simplicity of a serverless AWS Lambda function.  Your Lambda functions control the behavior of phone calls, such as playing voice prompts, collecting digits, recording calls, routing calls to the PSTN and Session Initiation Protocol (SIP) devices using Amazon Chime Voice Connector. The following topics provide an overview and architectural information about the PSTN Audio service, including how to build Lambda functions to control calls. You can read our introduction of the service [here](https://docs.aws.amazon.com/chime/latest/dg/build-lambdas-for-sip-sdk.html).

PSTN Audio applications are serverless, deployed as [AWS Lambda functions](https://aws.amazon.com/lambda/).  If you can write relatively simple code in javascript or python then you can build an advanced telephony application.  This workshop aims to teach the basics of how to use the PSTN Audio service and builds successively towards more advanced capability, starting with the absolute basics. 

# What to Do First

First, you need an environment to run this CDK script. That could be your own computer, but it's probably easier to get a cloud linux computer.    This is a classic case for a throw-away EC2 environment that can be easily created and disposed of (see [here](https://github.com/aws-samples/single-ec2-cdk)).

The important thing is that you need an environment to run the AWS CDK.  Detailed instructions are [here](../docs/development-environment/README.md). Once you have an environment, from the command line (terminal) do the following:

```bash
git clone https://github.com/aws-samples/amazon-chime-sdk-lex-lambda
cd amazon-chime-sdk-lex-lambda
```

You are now in the root of the code repository.  You can quickly deploy the resources like this:

```bash
yarn deploy
```

That's it.  Just wait for it to finish.  The output will look something like this:

```bash
✅  AmazonChimeSdkLexLambdaStack (no changes)

✨  Deployment time: 5.57s

Outputs:
AmazonChimeSdkLexLambdaStack.lexArn = arn:aws:ssm:us-east-1:<acct number>:parameter/amazon-chime-sdk-lambda-lex-arn
AmazonChimeSdkLexLambdaStack.logGroup = /aws/lambda/AmazonChimeSdkLexLambdaStack-App-smaLambdaF902E845-IKw2XzlpfdEX
AmazonChimeSdkLexLambdaStack.phoneNumber = +15055551212
AmazonChimeSdkLexLambdaStack.smaHandlerArn = arn:aws:lambda:us-east-1:<acct number>:function:AmazonChimeSdkLexLambdaStack-App-smaLambdaE902E845-IKw1XzlpfdEX
AmazonChimeSdkLexLambdaStack.smaHandlerName = AmazonChimeSdkLexLambdaStack-App-smaLambdaF902F845-IKw1XzlpfdEX
AmazonChimeSdkLexLambdaStack.smaId = e6d8166c-bf5c-4d78-b104-89ea8f171a3a
Stack ARN:
arn:aws:cloudformation:us-east-1:<acct number>:stack/AmazonChimeSdkLexLambdaStack/964275f0-b464-11ec-b0c3-12adbbb876ef

✨  Total time: 15.15s
```

## Wait, What Phone Number?

It may be hard to see the phone number in that data block.  We made it easy for you:

```bash
yarn number
```

It should look something like this:

```bash
yarn run v1.22.17
$ scripts/number
+1505-555-1212
✨  Done in 0.13s.
```

## Did it Work?

Call the phone number listed.  This example is obsfucated, but if you call the number it should answer.  NOTE:  until you set the Amazon Lex chat bot in the [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) you will just get an error message read to you.


## Creating the Amazon Chime Lex Bot

First, you need to make an Amazon Chime Lex bot.  IMPORTANT:  the bot must be in the same region you used to deploy this script (either us-east-1 or us-west-2).  

Deploying the Amazon Lex bot will cause your AWS Account to be billed for the Amazon Lex service. To minimize your expenses, after you finish using this demo please delete the resources you created.  Since you created the Amazon Lex bot outside this example, you will have to destroy it the same way.

Use of Amazon Lex is subject to the AWS Service Terms, including the terms specific to the AWS Machine Learning and Artificial Intelligence Services.

A detailed HOWTO for configuring a sample bot is [here](./docs/make-lex-bot.md).  The key thing you need is the Amazon Lex bot "Alias ARN."  

# Configuration
## Associating the Amazon Lex Bot to the Lambda Function

Once you have the Lex Bot Alias ARN you need to [save that into the Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/param-create-cli.html).  An example using the AWS CLI is:

```bash
aws ssm put-parameter --name "amazon-chime-sdk-lambda-lex-arn" --value "<LEX-ARN-HERE>" --type String 
```

To test that it was set:

```bash
aws ssm get-parameter --name "amazon-chime-sdk-lambda-lex-arn"
{
    "Parameter": {
        "Name": "amazon-chime-sdk-lambda-lex-arn",
        "Type": "String",
        "Value": "<LEX-ARN-HERE>",
        "Version": 1,
        "LastModifiedDate": "2022-04-04T17:11:11.981000-05:00",
        "ARN": "arn:aws:ssm:us-west-2:<acct number>:parameter/amazon-chime-sdk-lambda-lex-arn",
        "DataType": "text"
    }
}
```

## Configuring the Welcome Message and Voice Focus

You must set a default welcome message for the bot.  This is also done via the parameter store.  An example using the CLI is:

```bash
aws ssm put-parameter --name "amazon-chime-sdk-lambda-lex-welcome" --value "Welcome to AWS Chime SDK Voice Service. Please say what you would like to do.  For example: I'd like to book a room, or, I'd like to rent a car."
```

Likewise, you can optionally enable Amazon Voice Vocus on the call.  This is Amazon's award-winning noise suppression technology.  To enable it:

```bash
aws ssm put-parameter --name "amazon-chime-sdk-lambda-lex-voice-focus" --value "true"
```

## Configuring By Script

An example script that sets all three configuration paramters is [provided for reference](./configure.sh).  You must edit the values but this might simplify your work.
## Testing the Lex Bot

Call the phone number listed.  The call should be answered by the Lex bot!

## What if it doesn't work?

Double check that you deployed this solution in the same region that your Lex bot is in.  Double check that you correctly set the "amazon-chime-sdk-lambda-lex-arn" value to the ARN of the bot alias.  You can also check the Lambda logs for error messages.  You can easily find the log group for the lambda using the helper script like this:

```bash
yarn logs
```

## What if I want a Phone Number in a Specific State or City or Area Code?

By default, this code will select a phone number in the state of New Mexico (high availability of numbers, plus sentimental reasons from the author).  If you want to select a number based on your own criteria, edit the file [lib/amazon-chime-sdk-lex-lambda-stack.ts](./lib/amazon-chime-sdk-lex-lambda-stack.ts).  Look for this block:

```typescript
 // CONFIGURATION POINT:  you can filter phone number requests by area code, city, state, country
    // any of the parameters in https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-chime/interfaces/searchavailablephonenumberscommandinput.html
    // constants are described in the source code at https://github.com/cdklabs/cdk-amazon-chime-resources/blob/main/src/phoneNumber.ts
    const chime = new Chime(this, 'Chime', {
      phoneNumberType: chimeconstruct.PhoneNumberType.LOCAL,
      phoneProductType: chimeconstruct.PhoneProductType.SMA,
      // phoneCountry: "US" // defaults to US
      phoneState: 'NM',
      // phoneAreaCode: "505",
      // phoneCity: "Albuquerque",
      // phoneNumberTollFreePrefix
      smaLambdaEndpointArn: application.smaLambdaEndpointArn, // do not edit, this is obtained dynamically from the application stack
    });
```
Change the parameters to suite your needs and deploy.

## Background Information/Reading

* [Programming Model - How it Works](./docs/how-it-works) - how to write software to control PSTN Audio
* [Development Environment](./docs/development-environment) - what you need to install to have a build environment - automation included!
* [Development Tips and Tricks](./docs/tips-and-tricks) - examples and guidance on how to do telephony development - revisit this as you get experience!
* [Deployment Automation](./docs/cdk-overview) - how we provision a PSTN phone number in the cloud and associate it with a lambda

## Disclaimers

Deploying the Amazon Chime SDK demo applications contained in this repository will cause your AWS Account to be billed for services, including the Amazon Chime SDK, used by the application.  To minimize your expenses, after finishing this demo please delete the resources you created.  This can be done by running 'yarn destroy' from this directory and from each of the workshop lesson folders that you deployed.  Since you created the Amazon Lex bot outside this example, you will have to destroy it the same way.

The voice prompt audio files are not encrypted, as would be recommended in a production-grade application.

Use of Amazon Lex is subject to the AWS Service Terms, including the terms specific to the AWS Machine Learning and Artificial Intelligence Services.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

All code in this repository is licensed under the MIT-0 License. See the LICENSE file.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
