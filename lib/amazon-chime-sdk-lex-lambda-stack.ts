/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Chime } from './chime-stack';
import { Application } from './application-stack';
import * as chimeconstruct from 'cdk-amazon-chime-resources';

// CONFIGURATION POINT: these are the SSM parameter names that get passed to the lambda 
const lexArn = "amazon-chime-sdk-lambda-lex-arn";
const welcome = "amazon-chime-sdk-lambda-lex-welcome";
const voiceFocus = "amazon-chime-sdk-lambda-lex-voice-focus";

export class AmazonChimeSdkLexLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const application = new Application(this, 'Application', {
      lexParamArn: lexArn,
      welcomeString: welcome,
      voiceFocusString: voiceFocus,
    });

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

    new CfnOutput(this, 'phoneNumber', { value: chime.phoneNumber });
    new CfnOutput(this, 'smaId', { value: chime.smaId });
    new CfnOutput(this, 'smaHandlerArn', { value: application.smaLambdaEndpointArn });
    new CfnOutput(this, 'smaHandlerName', { value: application.smaLambdaName });
    new CfnOutput(this, 'logGroup', { value: application.handlerLambdaLogGroupName });
    new CfnOutput(this, 'ssmLexArnName', { value: lexArn });
    new CfnOutput(this, 'ssmWelcomeName', { value: lexArn });
    new CfnOutput(this, 'ssmVoiceFocusName', { value: voiceFocus });
  }
}

