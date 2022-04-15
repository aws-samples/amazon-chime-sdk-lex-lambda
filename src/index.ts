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
import { ssmParameter } from 'aws-parameter-cache';

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
      response.Actions = await startBot(event);
      break;

    case "ACTION_SUCCESSFUL":
      console.log("ACTION_SUCCESSFUL");
      response.Actions = actionSuccessful(event)
      break;

    case 'HANGUP':
      break;

    default:
      console.log('DEFAULT', event);
  }

  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};

async function startBot(event: any) {

  const lexArnName = process.env.LEX_ARN_NAME;
  const lexWelcomeName = process.env.WELCOME_NAME;
  const voiceFocusName = process.env.VF_NAME;
  var botAlias: string = "none";

  if (lexArnName) {
    const arn = ssmParameter({ name: lexArnName });
    arn.refresh();
    botAlias = await arn.value as string;
  }
  if (botAlias) {
    const first3 = botAlias.slice(0, 12);
    if (first3 == "arn:aws:lex:") {
      console.log("looks like an ARN: ", botAlias);
    } else {
      console.log("error reading Lex ARN: ", botAlias);
      speakAction.Parameters.Text = "<speak>Hello!  Our apologies, there is no Amazon Lex Bot attached to this number.  Goodbye!</speak>";
      return [pauseAction, speakAction, hangupAction];
    }
  }

  var welcomeMsg = "";
  if (lexWelcomeName) {
    const welcome = ssmParameter({ name: lexWelcomeName });
    welcome.refresh();
    welcomeMsg = await welcome.value as string;
  }
  if (welcomeMsg) {
    startBotConversationAction.Parameters.Configuration.WelcomeMessages[0].Content = welcomeMsg;
  } else {
    startBotConversationAction.Parameters.Configuration.WelcomeMessages[0].Content = "No welcome message.  ";
    console.log("no welcome message set in ssm name: ", lexWelcomeName);
  }

  var voiceFocus = "false";
  if (voiceFocusName) {
    const focus = ssmParameter({ name: voiceFocusName });
    focus.refresh();
    voiceFocus = await focus.value as string;
  }
  if (voiceFocus == "true" || voiceFocus == "on") {
    voiceFocusAction.Parameters.Enable = true;
    voiceFocusAction.Parameters.CallId = event.CallDetails.Participants[0].CallId;
  } else {
    voiceFocusAction.Parameters.Enable = false;
    voiceFocusAction.Parameters.CallId = event.CallDetails.Participants[0].CallId;
  }
  startBotConversationAction.Parameters.BotAliasArn = botAlias;
  return [pauseAction, voiceFocusAction, startBotConversationAction];

}

const startBotConversationAction = {
  Type: "StartBotConversation",
  Parameters: {
    BotAliasArn: "none",
    LocaleId: "en_US",
    Configuration: {
      SessionState: {
        DialogAction: {
          Type: "ElicitIntent"
        }
      },
      WelcomeMessages: [
        {
          ContentType: "PlainText",
          Content: "Welcome to AWS Chime SDK Voice Service. Please say what you would like to do.  For example: I'd like to book a room, or, I'd like to rent a car."
        },
      ]
    }
  }
}

function actionSuccessful(event: any) {

  if (event.ActionData.IntentResult.SessionState.Intent.Name == "FallbackIntent") {
    return [pauseAction, startBotConversationAction];
  }
  return [pauseAction, hangupAction];
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

