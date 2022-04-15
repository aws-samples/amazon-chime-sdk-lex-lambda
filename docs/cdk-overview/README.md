# Overview of CDK for PSTN Audio

This small section cannot teach you everything about the [Amazon Cloud Development Kit (v2) (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html).  We highly recommend the excellent [base workshop](https://cdkworkshop.com/) and the [advanced follow-on workshop](https://catalog.us-east-1.prod.workshops.aws/workshops/071bbc60-6c1f-47b6-8c66-e84f5dc96b3f/en-US) to teach you how to use the SDK.  

This page will just outline the basic structure of our very simple CDK scripts.

## High-Level Approach

This main level of the directory structure creates a basic PSTN Audio telephony application.  It has it's CDK components in the lib folder, and the actual lambda application in the src folder.  The AWS Lambda Function (Lambda) in that folder just answers the phone and tells you what phone number you are calling from.  It's a placeholder only at this time.  We will walk through a set of example Lambdas in this workshop.  When you deploy the application, you must have a Lambda function in order to create the SIP Media Appliance (SMA).  Please see the ["How it Works"](../how-it-works/README.md) document for details.  To speed deployment during development/workshop learning, we will deploy the parent stack once.  As we test a workshop Lambda, we swap the new "child" Lambda for the parent using an API call.  This is not recommended in production if you are using AWS CloudFormation stacks to manage your infra, because this intentionally introduces drift (e.g. the configured Lambda is not managed by the parent stack).  We do this during development and learning however, because it is faster.  Deploying the parent stack takes over two minutes.  Deploying just a new Lambda and swapping it's configuration takes about 10 seconds.

In summary, we have a parent stack that deploys the telephony resources, and then children stacks that only have a lambda function.  We'll discuss the childred in the workshop lessons.  

## Parent Stack

The file amazon-chime-sdk-pstn-audio-workshop-stack.ts is the top-level, parent stack.  It is organized into substacks to make things clear about where they are getting created:  The telephony resources are not likely to be changed often, so re-deploys should be a little faster if only the application parts changed.  The files in the stack are in the ["lib"](../lib) folder:


```bash
.
├── amazon-chime-sdk-pstn-audio-workshop-stack.ts
├── application-stack.ts
└── chime-stack.ts
```

The main stack creates the other two sub-stacks:

```typescript
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Chime } from './chime-stack';
import { Application } from './application-stack';

export class AmazonChimeSdkPstnAudioWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const application = new Application(this, 'Application', {});

    const chime = new Chime(this, 'Chime', {
      phoneState: 'NM',
      smaLambdaEndpointArn: application.smaLambdaEndpointArn,
    });

    new CfnOutput(this, 'phoneNumber', { value: chime.phoneNumber });
    new CfnOutput(this, 'smaId', { value: chime.smaId });
    new CfnOutput(this, 'smaHandlerArn', { value: application.smaLambdaEndpointArn });
    new CfnOutput(this, 'smaHandlerName', { value: application.smaLambdaName });
    new CfnOutput(this, 'logGroup', { value: application.handlerLambdaLogGroupName });
  }
}
```

This is pretty simple:  it creates two sub-stacks.  One is for the application components, the other is for the Amazon Chime SDK resources.  

## Application Stack

```typescript
import { Construct } from 'constructs';
import { Duration, NestedStackProps, NestedStack, RemovalPolicy } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface ApplicationProps extends NestedStackProps {
}

export class Application extends NestedStack {
  public readonly smaLambdaName: string;
  public readonly smaLambdaEndpointArn: string;
  public readonly handlerLambdaLogGroupName: string;

  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id, props);

    const applicationRole = new iam.Role(this, 'applicationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    // create lambda snipped out for brevity
}
```

The first thing we do is create an AWS Identity Access and Managemente (IAM) role for the application, which is just the Lambda.  Next we will create the Lambda and set it's role so that it is allowed to execute.  Let's dig into some of the Lambda creation settings.

```typescript
   const smaLambda = new NodejsFunction(this, 'smaLambda', {
      entry: 'src/index.ts',
      handler: 'handler',
      bundling: {
        sourceMap: true,
        minify: false,
        externalModules: ['aws-sdk'],
        nodeModules: ['uuid',],
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps'
      },
      runtime: Runtime.NODEJS_14_X,
      role: applicationRole,
      timeout: Duration.seconds(60),
    });

    this.smaLambdaName = smaLambda.functionName;
    this.smaLambdaEndpointArn = smaLambda.functionArn;
    this.handlerLambdaLogGroupName = smaLambda.logGroup.logGroupName;
  }
  ```

We create the Lambda using the new [NodeJs Function](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html) call.  Let's go over a few of the fields:

* entry: this points to the source code of the lambda function
* handler: this is the function name to call in that source code file
* bundling: this tells CDK to "bundle" the code, either with docker or with "esbuild" which is what we are doing
* sourceMap: we set this to true so that logs created in CloudWatch can "map" back to the ts code, not just to the transpiled js code
* minify: we set this to false so we can still read the code when we inspect the lambda in the console 
* externalModules: since aws-sdk is already avalable to all node lambdas, we don't need to bundle it 
* nodeModules: what added modules we should bundle.  We don't actually need uuid, we only include it for reference to show you how
* environment: this is how we can pass ENV variables, including enabling source maps
* runtime: we select Node as our runtime
* role: points to the role that we created earlier
* timeout: how long the function can run; this could easily be the default 3 seconds

We then expose variables so that the parent stack can "read" them.

## Chime Stack

The Amazon Chime SDK resources are deployed through this sub-stack.  In this simple example we pass in the Lambda from the application stack and a string of the US State that we want the phone number to be from.  We could expand this to include the other attributes possible from the resource constructs, but that is beyond the scope of this example.


```typescript
import { Construct } from 'constructs';
import { NestedStackProps, NestedStack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as chime from 'cdk-amazon-chime-resources';


interface ChimeProps extends NestedStackProps {
  smaLambdaEndpointArn: string;
  phoneState: string;
}

export class Chime extends NestedStack {
  public readonly phoneNumber: string;
  public readonly smaId: string;

  constructor(scope: Construct, id: string, props: ChimeProps) {
    super(scope, id, props);

    const smaHandlerRole = new iam.Role(this, 'smaHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    const phoneNumber = new chime.ChimePhoneNumber(this, 'phoneNumber', {
      phoneState: props.phoneState,
      phoneNumberType: chime.PhoneNumberType.LOCAL,
      phoneProductType: chime.PhoneProductType.SMA,
    });

    const sipMediaApp = new chime.ChimeSipMediaApp(this, 'sipMediaApp', {
      region: this.region,
      endpoint: props.smaLambdaEndpointArn,
    });

    const sipRule = new chime.ChimeSipRule(this, 'sipRule', {
      triggerType: chime.TriggerType.TO_PHONE_NUMBER,
      triggerValue: phoneNumber.phoneNumber,
      targetApplications: [
        {
          region: this.region,
          priority: 1,
          sipMediaApplicationId: sipMediaApp.sipMediaAppId,
        },
      ],
    });

    const pstnPollyRole = new iam.Role(this, 'pstnPollyRole', {
      assumedBy: new iam.ServicePrincipal('voiceconnector.chime.amazonaws.com'),
    });
    pstnPollyRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: ['polly:SynthesizeSpeech'],
    }));

/* uncomment this once we have lex in prod 
    const pstnLexRole = new iam.Role(this, 'pstnLexRole', {
      assumedBy: new iam.ServicePrincipal('voiceconnector.chime.amazonaws.com'),
    });
    pstnLexRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],  // needs to be scoped down
      actions: ['lex:*'], // needs to be scoped down
    }));
    */

    this.phoneNumber = phoneNumber.phoneNumber;
    this.smaId = sipMediaApp.sipMediaAppId;
  }
}
```

We first create the role, then we create the phone number, the SIP Media Application, and the SIP Rule.  We then set the IAM permissions so that the SMA can call Amazon Polly and Amazon Lex.  We then set the phone number and SMA ID so that the parent object can read them.

## Phone Numbers

You have some control over what phone number you select.  You can filter down to choose area code, state, city, or country.  In summary, they fields you can use are:

* phoneAreaCode
* phoneCity
* phoneState
* phoneCountry
* phoneNumberTollFreePrefix

For more details, please see the [phone number](https://github.com/cdklabs/cdk-amazon-chime-resources/blob/main/src/phoneNumber.ts) file in the actual construct for the fields you can specify.
