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
import { Duration, NestedStackProps, NestedStack, RemovalPolicy } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

const param = "amazon-chime-sdk-lambda-lex-arn"; // this is the parameter name that will be searched in ssm to find the lambda arn

interface ApplicationProps extends NestedStackProps {
  lexParamArn: string,
  welcomeString: string,
  voiceFocusString: string,
}

export class Application extends NestedStack {
  public readonly smaLambdaName: string;
  public readonly smaLambdaEndpointArn: string;
  public readonly handlerLambdaLogGroupName: string;
  public readonly ssmParameterArn: string;
  public readonly ssmParameterWelcome: string;
  public readonly ssmParameterVF: string;

  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id, props);

    const accountID = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;
    const arnResource = 'arn:aws:ssm:' + region + ':' + accountID + ':parameter/' + props.lexParamArn;
    const welcomeResource = 'arn:aws:ssm:' + region + ':' + accountID + ':parameter/' + props.welcomeString;
    const vfResource = 'arn:aws:ssm:' + region + ':' + accountID + ':parameter/' + props.voiceFocusString;

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
        ['ssmPolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: [arnResource, welcomeResource, vfResource],
              actions: ['ssm:GetParameter'],
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
        NODE_OPTIONS: '--enable-source-maps',
        LEX_ARN_NAME: props.lexParamArn,
        WELCOME_NAME: props.welcomeString,
        VF_NAME: props.voiceFocusString,
      },
      runtime: Runtime.NODEJS_14_X,
      role: applicationRole,
      timeout: Duration.seconds(60),
    });

    this.smaLambdaName = smaLambda.functionName;
    this.smaLambdaEndpointArn = smaLambda.functionArn;
    this.handlerLambdaLogGroupName = smaLambda.logGroup.logGroupName;
    this.ssmParameterArn = arnResource;
    this.ssmParameterWelcome = welcomeResource;
    this.ssmParameterVF = vfResource;
  }
}
