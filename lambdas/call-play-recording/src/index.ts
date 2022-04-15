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

import { ChimeClient, CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime";
import { SecretValue } from "aws-cdk-lib";
import { Interface } from "readline";
import 'source-map-support/register';

const wavFileBucket = process.env['WAVFILE_BUCKET'];
const chimeClient = new ChimeClient({ region: "REGION" });

let generalResponse: smaResponse = {
  SchemaVersion: '1.0',
  Actions: [],
}

exports.handler = async (event: any, context: any, callback: any) => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let response = generalResponse;

  switch (event.InvocationEventType) {

    case "NEW_INBOUND_CALL":
      response.Actions = newCall(event);
      const attributes = {
        "key1": "val1*",
        "key2": "val2*",
        "key3": "val3*",
      }
      response.TransactionAttributes = attributes;
      break;
    case "ACTION_SUCCESSFUL":
      console.log("ACTION_SUCCESSFUL");
      break;

    case 'HANGUP':
      console.log('HANGUP');
      break;

    default:
  }
  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};


function newCall(event: any) {
  console.log("wavFileBucket: ", wavFileBucket);

  playAudioAction.Parameters.AudioSource.Key = "hello-goodbye.wav";
  const from = event.CallDetails.Participants[0].From;

  return [pauseAction, playAudioAction, hangupAction];
}

interface smaAction {
  Type: string;
  Parameters: {};
};
interface smaActions extends Array<smaAction> { };

interface smaResponse {
  SchemaVersion: string;
  Actions: smaActions;
  TransactionAttributes?: Object;
}

const response: smaResponse = {
  SchemaVersion: '1.0',
  Actions: [],
};

const playAudioAction = {
  Type: "PlayAudio",
  Parameters: {
    Repeat: "1",
    AudioSource: {
      Type: "S3",
      BucketName: wavFileBucket,
      Key: "",
    },
  },
};

const pauseAction = {
  Type: "Pause",
  Parameters: {
    DurationInMilliseconds: "1000",
  },
};

const hangupAction = {
  Type: "Hangup",
  Parameters: {
    SipResponseCode: "0",
    ParticipantTag: "",
  },
};
