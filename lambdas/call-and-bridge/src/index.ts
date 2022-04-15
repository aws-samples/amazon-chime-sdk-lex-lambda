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

import { ChimeClient, CreateSipMediaApplicationCallCommand, Participant } from "@aws-sdk/client-chime";
import 'source-map-support/register';

const wavFileBucket = process.env['WAVFILE_BUCKET'];
const chimeClient = new ChimeClient({ region: "REGION" });

//const blockRegex = "/^\+((1900)|(1976)|(1268)|(1284)|(1473)|(1649)|(1664)|(1767)|(1809)|(1829)|(1849)|(1876))(\d{7})$/;"

let generalResponse: smaResponse = {
  SchemaVersion: '1.0',
  Actions: [],
};

exports.handler = async (event: any, context: any, callback: any) => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let response = generalResponse;

  switch (event.InvocationEventType) {
    case "NEW_INBOUND_CALL":
      response.Actions = await newCall(event);
      break;

    case "ACTION_SUCCESSFUL":
      console.log("ACTION_SUCCESSFUL");
      response.Actions = await actionSuccessful(event);
      break;

    case "DIGITS_RECEIVED":
      console.log("DIGITS_RECEIVED");
      response.Actions = await digitsReceived(event);
      break;

    case 'HANGUP':
      console.log('HANGUP');
      break;

    default:
      console.log('DEFAULT', event);
  }
  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};

async function newCall(event: any) {
  const callId = event.CallDetails.Participants[0].CallId;
  speakCollectDigitsAction.Parameters.CallId = callId;
  speakCollectDigitsAction.Parameters.InputDigitsRegex = "^[1][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]";
  speakCollectDigitsAction.Parameters.SpeechParameters.Text = "<speak>Hello!  Please enter the number you would like to call, starting with a one followed by ten digits</speak>";

  return [pauseAction, speakCollectDigitsAction];
}

async function actionSuccessful(event: any) {
  let actions: any;

  switch (event.ActionData.Type) {

    case "SpeakAndGetDigits":
      actions = await placeCall(event);
      break;
    case "CallAndBridge":
      actions = await connectCall(event);
      break;
    case "ReceiveDigits":
      actions = [];
      break;
    case "VoiceFocus":
      console.log("Voice Focus: " + event.ActionData.Parameters.Enable)
    default:
      actions = [];
  }
  return actions;
}


function placeCall(event: any) {
  callAndBridgeAction.Parameters.CallerIdNumber = event.CallDetails.Participants[0].From;
  callAndBridgeAction.Parameters.RingbackTone.Key = "ringback.wav";
  callAndBridgeAction.Parameters.Endpoints[0].Uri = "+" + event.ActionData.ReceivedDigits;
  return [pauseAction, callAndBridgeAction];
}

function connectCall(event: any) {
  const callId = findParticipantCallId(event, "Inbound");
  const callId2 = findParticipantCallId(event, "Outbound");

  // disable Voice Focus initially
  voiceFocusAction.Parameters.CallId = callId;
  voiceFocusAction.Parameters.Enable = false;

  voiceFocusAction2.Parameters.CallId = callId2;
  voiceFocusAction2.Parameters.Enable = false;

  receiveDigitsAction.Parameters.CallId = callId;
  receiveDigitsAction.Parameters.InputDigitsRegex = "[0-1]$";
  return [voiceFocusAction, voiceFocusAction2, receiveDigitsAction];
}

function digitsReceived(event: any) {
  let actions: any;
  if (event.ActionData.Type = "ReceivedDigits") {
    voiceFocusAction.Parameters.CallId = findParticipantCallId(event, "Inbound");
    voiceFocusAction2.Parameters.CallId = findParticipantCallId(event, "Outbound");

    switch (event.ActionData.ReceivedDigits) {
      case "0":
        voiceFocusAction.Parameters.Enable = false;
        voiceFocusAction2.Parameters.Enable = false;
        break;
      case "1":
        voiceFocusAction.Parameters.Enable = true;
        voiceFocusAction2.Parameters.Enable = true;
        break;
    }
    receiveDigitsAction.Parameters.CallId = findParticipantCallId(event, "Inbound");
    receiveDigitsAction.Parameters.InputDigitsRegex = "[0-1]$";
    actions = [voiceFocusAction, voiceFocusAction2, receiveDigitsAction];
    return actions;
  }
}


function findParticipantCallId(event: any, direction: string): string {
  let callId: string = "none";

  if (event.CallDetails.Participants[0].Direction == direction) {
    callId = event.CallDetails.Participants[0].CallId;
  }
  if (event.CallDetails.Participants[1].Direction == direction) {
    callId = event.CallDetails.Participants[1].CallId;
  }

  return callId;
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

const speakCollectDigitsAction = {
  Type: "SpeakAndGetDigits",
  Parameters: {
    CallId: "call-id-1",          // required
    InputDigitsRegex: "", // optional
    SpeechParameters: {
      Text: "<speak>Hello World</speak>",      // required
      Engine: "neural",         // optional. Defaults to standard
      LanguageCode: "en-US",    // optional
      TextType: "ssml",         // optional
      VoiceId: "Joanna",         // optional. Defaults to Joanna
    },
    FailureSpeechParameters: {
      Text: "<speak>Ooops, there was an error.</speak>",      // required
      Engine: "neural",         // optional. Defaults to the Engine value in SpeechParameters
      LanguageCode: "en-US",    // optional. Defaults to the LanguageCode value in SpeechParameters
      TextType: "ssml",         // optional. Defaults to the TextType value in SpeechParameters
      VoiceId: "Joanna",        // optional. Defaults to the VoiceId value in SpeechParameters
    },
    MinNumberOfDigits: 11,         // optional
    MaxNumberOfDigits: 11,         // optional
    TerminatorDigits: ["#"],      // optional
    InBetweenDigitsDurationInMilliseconds: 5000,  // optional
    Repeat: 3,                    // optional
    RepeatDurationInMilliseconds: 10000           // required
  }
}

const callAndBridgeAction = {
  Type: "CallAndBridge",
  Parameters: {
    CallTimeoutSeconds: 30,
    CallerIdNumber: "e164PhoneNumber", // required
    RingbackTone: { // optional
      Type: "S3",
      BucketName: wavFileBucket,
      Key: "audio_file_name"
    },
    Endpoints: [
      {
        Uri: "e164PhoneNumber", // required
        BridgeEndpointType: "PSTN" // required
      }
    ],
    CustomSipHeaders: {
      String: "String"
    }
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

interface voiceFocusParameters {
  Enable: boolean;
  CallId: string;
}
interface voiceFocusActionObject {
  Type: string;
  Parameters: voiceFocusParameters;
}

const voiceFocusAction = {
  Type: "VoiceFocus",
  Parameters: {
    Enable: true, // false         // required
    CallId: "call-id-1",           // required
  }
}
const voiceFocusAction2 = {
  Type: "VoiceFocus",
  Parameters: {
    Enable: true, // false         // required
    CallId: "call-id-1",           // required
  }
}

const receiveDigitsAction = {
  Type: "ReceiveDigits",
  Parameters: {
    CallId: "call-id-1",  // optional
    ParticipantTag: "LEG-A", // optional
    InputDigitsRegex: "^[1][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]",  // required
    InBetweenDigitsDurationInMilliseconds: 1000,
    FlushDigitsDurationInMilliseconds: 10000
  }
}

