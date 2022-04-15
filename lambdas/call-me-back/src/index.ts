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
import 'source-map-support/register';

let generalResponse: smaResponse = {
  SchemaVersion: '1.0',
  Actions: [],
}

const chimeClient = new ChimeClient({ region: "REGION" });


exports.handler = async (event: any, context: any, callback: any) => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let response = generalResponse;

  switch (event.InvocationEventType) {
    case "NEW_INBOUND_CALL":
      response.Actions = newCall(event);
      break;

    case "ACTION_SUCCESSFUL":
      console.log("ACTION_SUCCESSFUL");
      if (event.CallDetails.Participants[0].Direction == 'Inbound') {
        response.Actions = [hangupAction];
      }
      break;

    case 'HANGUP':
      console.log('HANGUP');
      if (event.CallDetails.Participants[0].Direction == 'Inbound') {
        makeDial(event);
      } else {
        console.log("Second hangup, task completed");
      }
      break;

    case 'NEW_OUTBOUND_CALL':
      console.log('NEW OUTBOUND CALL');
      break;

    case 'RINGING':
      console.log('RINGING');
      break;

    case 'CALL_ANSWERED':
      console.log('CALL_ANSWERED');
      response.Actions = callAnswered(event);
      break;

    default:
      console.log('DEFAULT', event);
  }

  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};


function newCall(event: any) {
  const from = event.CallDetails.Participants[0].From;
  speakAction.Parameters.Text = "<speak>Hello!  I will call you back!  Goodbye!</speak>";
  return [pauseAction, speakAction, hangupAction];
}

async function makeDial(event: any) {
  console.log(event);
  var params = {
    FromPhoneNumber: event.CallDetails.Participants[0].To,
    SipMediaApplicationId: event.CallDetails.SipMediaApplicationId,
    ToPhoneNumber: event.CallDetails.Participants[0].From,
    SipHeaders: {},
  };
  console.info('params: ' + JSON.stringify(params));
  const command = new CreateSipMediaApplicationCallCommand(params);
  try {
    const response = await chimeClient.send(command);
  } catch (err) {
    console.log(err);
    return err;
  }
}

function callAnswered(event: any) {
  const from = event.CallDetails.Participants[0].From;
  speakAction.Parameters.Text = "<speak>Hello!  I am just calling you back!  Goodbye!</speak>";
  return [pauseAction, speakAction, pauseAction, hangupAction];
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


const speakAction = {
  Type: "Speak",
  Parameters: {
    Engine: "neural", // Required. Either standard or neural
    LanguageCode: "en-US", // Optional
    Text: "", // Required
    TextType: "ssml", // Optional. Defaults to text
    VoiceId: "Matthew" // Required
  }
}

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
