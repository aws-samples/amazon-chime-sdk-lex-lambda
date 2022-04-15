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

import { Construct } from 'constructs';
import { Duration, Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
const path = require('path');

export class CallPlayRecordingStack extends Stack {
  public readonly wavFileBucketName: string;
  public readonly smaLambdaEndpointArn: string;
  public readonly handlerLambdaLogGroupName: string;
  public readonly smaLambdaName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create a bucket for the recorded wave files and set the right policies
    const wavFiles = new s3.Bucket(this, 'wavFiles', {
      publicReadAccess: false,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const wavFileBucketPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
      ],
      resources: [
        wavFiles.bucketArn,
        `${wavFiles.bucketArn}/*`
      ],
      sid: 'SIPMediaApplicationRead',
    });
    wavFileBucketPolicy.addServicePrincipal('voiceconnector.chime.amazonaws.com');
    wavFiles.addToResourcePolicy(wavFileBucketPolicy);

    new s3deploy.BucketDeployment(this, "WavDeploy", {
      sources: [s3deploy.Source.asset("./wav_files")],
      destinationBucket: wavFiles,
      contentType: "audio/wav",
    });

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
        WAVFILE_BUCKET: wavFiles.bucketName,
      },
      runtime: Runtime.NODEJS_14_X,
      role: applicationRole,
      timeout: Duration.seconds(60),
    });

    this.smaLambdaEndpointArn = smaLambda.functionArn;
    this.handlerLambdaLogGroupName = smaLambda.logGroup.logGroupName;
    this.smaLambdaName = smaLambda.functionName;
    new CfnOutput(this, 'smaHandlerArn', { value: this.smaLambdaEndpointArn });
    new CfnOutput(this, 'logGroup', { value: this.handlerLambdaLogGroupName });
    new CfnOutput(this, 'smaHandlerName', { value: this.smaLambdaName });
  }
}
