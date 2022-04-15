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

import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import { NestedStackProps, NestedStack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as chime from 'cdk-amazon-chime-resources';
import { PhoneNumberType, PhoneProductType } from 'cdk-amazon-chime-resources';


interface ChimeProps extends NestedStackProps {
  phoneNumberType?: PhoneNumberType;
  phoneProductType?: PhoneProductType;
  phoneCountry?: string;
  phoneState?: string;
  phoneAreaCode?: string;
  phoneCity?: string;
  phoneNumberTollFreePrefix?: string;
  smaLambdaEndpointArn: string;
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


    this.phoneNumber = phoneNumber.phoneNumber;
    this.smaId = sipMediaApp.sipMediaAppId;
  }
}
