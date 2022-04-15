# What to Do First

This set of workshops deploys a set of resources needed for all the demo code.  Those resources are deployed once and re-used for each of the lessons.  You need to do that deployment as a first step.  

First, you need a development environment.  That could be your own computer, but it's probably easier to get a cloud linux computer.  See [here](../docs/development-environment/README.md) for more info.

Once you have a development environment, from the command line (terminal) do the following:

```bash
git clone https://github.com/aws-samples/amazon-chime-sdk-pstn-audio-workshop
cd amazon-chime-sdk-pstn-audio-workshop
```

You are now in the root of the code repository.  You can quickly deploy the resources and an example application by this:

```bash
yarn deploy
```

That's it.  Just wait for it to finish.  The output will look something like this:

```bash
✅  AmazonChimeSdkPstnAudioWorkshopStack

✨  Deployment time: 204.06s

Outputs:
AmazonChimeSdkPstnAudioWorkshopStack.logGroup = /aws/lambda/AmazonChimeSdkPstnAudioWorkshopS-smaLambdaF902F845-2OyCzDJoVbjY
AmazonChimeSdkPstnAudioWorkshopStack.phoneNumber = +15055551212
AmazonChimeSdkPstnAudioWorkshopStack.smaHandlerArn = arn:aws:lambda:us-east-1:<acct number>:function:AmazonChimeSdkPstnAudioWorkshopS-smaLambdaF902E845-2OyCzDJoVbjY
AmazonChimeSdkPstnAudioWorkshopStack.smaHandlerName = AmazonChimeSdkPstnAudioWorkshopS-smaLambdaF912E835-2OyCzDJoVbjY
AmazonChimeSdkPstnAudioWorkshopStack.smaId = d408563b-4a60-4df7-bd59-82660adb1928
Stack ARN:
arn:aws:cloudformation:us-east-1:<acct number>:stack/AmazonChimeSdkPstnAudioWorkshopStack/213ac5d0-9df7-11ec-99d6-12f8bc0d6961

✨  Total time: 212.9s

✨  Done in 223.78s.
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

Call the phone number listed.  This example is obsfucated, but if you call the number it should answer and speak back to you what number you are calling from

## Next Steps

You can now proceed to the lessons [here](../lambdas/call-me-back/README.md).