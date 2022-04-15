# Tips and Tricks for Developing PSTN Audio Applications

This page details some useful tricks and tips to make developing for the Amazon Chime SDK PSTN Audio service easier.
# Using Amazon CloudWatch (CloudWatch)

All of the examples are set to output data from the CDK to a json file.  We provide some "helper scripts" using the open source tool "jq" to automate things.  You can see the log group with this:

```bash
yarn group
yarn run v1.22.17
$ scripts/group
/aws/lambda/CallLexBotStack-smaLambdaF902E845-PGkuro03GFOl
✨  Done in 0.09s.
```

Connect to the [Amazon CloudWatch console](https://console.aws.amazon.com/cloudwatch/home) and click on "Log Groups" on the left panel.  Copy and paste the output from above into the filter and the logs for your lambda function will be made available.  Clicking on the log stream at the top of the list will show you the latest logs.  You can click on any event.  

Sometimes the log file will be very long, with many duplicated messages.  This can happen if you have an error in your code, for example.  If you want to "jump" to the beginning of that log stream, in the "filter events" box at the top of the page just enter a single space and hit "enter."  That will jump you to the top and you can then page through the logs to find where your error started.

# Using the AWS Lambda Console

Once you have run the deploy ("yarn deploy") you can go to the [AWS Lambda (Lambda) Console](https://console.aws.amazon.com/lambda/home) and inspect it.  All of the examples are set to output data from the AWS Cloud Development Kit (CDK) to a json file.  We provide some "helper scripts" using the open source tool "jq" to automate things.  You can see the ARN of the lambda with this:

```bash
yarn lambda
yarn run v1.22.17
$ scripts/lambda
"CallLexBotStack-smaLambdaF902E845-PGkuro03GFOl"
✨  Done in 0.10s.
```

Copy and paste the Lambda name into the "Filter" box at the top of the page and then click on the function name.  You can now inspect the code of the Lambda using their editor.  

The Lambda console editor can be especially powerful in finding unusual errors in your code.  It will mark lines with an error with a red mark at the line number.  Consider using this trick if you don't understand where your code is failing only from the log files.

# Speeding Up Lambda Development

We have done a few things to make deploying these CDK scripts faster.  First, we have broken the stacks into sub-stacks where it makes sense.  This makes stack deploys faster since stacks that did not change can be skipped over.  We also use the "cdk deploy --hotswap" flag.  This is not a good idea in production, but in development it swaps things it can, instead of doing a full deploy.

The biggest thing we do, though, is break out the example Lambdas into their own stacks.  We then use "yarn swap" which does a "aws chime update-sip-media-application" to directly tell the system to use the new lambda.  This drops deploys from several minutes to under 10 seconds!  However, this also is not for production.  Doing this definitely introduces drift into the stack.  It's ONLY for development.

# Why Yarn

We are trying to standardize on yarn.  At one point it was substantially faster than npm, but that is probably no longer the case.  You can use npm if you prefer, but all our examples use yarn.

# Handy Scripts We Included

* *yarn destroy - destroys the stack
* yarn status  - will read the stack name from the cdk-output.json file and print out the state of the stack, or, give an error if that stack is not deployed
* yarn group   - will print the CloudWatch Log Group 
* yarn logs    - will start a "tail" on the CloudWatch Log Group - note, there's up to about 30second latency before logs show up
* yarn number  - will print the phone number associated with this stack
* yarn clean   - will delete all non-code files - including the CDK output!  Don't do this before a "yarn destroy"
* yarn active  - will print the ARN of the active Lambda for the stack - useful with "yarn swap"
* yarn swap    - will "swap" the current active Lambda - used during development (see above)

Finally, "yarn run versions" will dump a lot of version info, that can be helpful if debugging:

```bash
yarn run versions
yarn run v1.22.17
$ scripts/versions
++ npm -v
8.1.2
++ node -v
v16.13.1
++ aws --version
aws-cli/2.4.6 Python/3.8.8 Darwin/21.3.0 exe/x86_64 prompt/off
++ cdk --version
2.12.0 (build c9786db)
++ npm list --depth=0
call-lex-bot@0.1.0 /Users/gherlein/src/chime/workshops/amazon-chime-sdk-pstn-audio-workshop/lambdas/call-lex-bot
├── @aws-sdk/client-chime@3.52.0
├── @balena/dockerignore@1.0.2 extraneous
├── @types/jest@26.0.24
├── @types/node@10.17.27
├── aws-cdk-lib@2.12.0
├── aws-cdk@2.12.0
├── case@1.6.3 extraneous
├── constructs@10.0.69
├── esbuild@0.14.23
├── ignore@5.2.0 extraneous
├── jest@26.6.3
├── jsonschema@1.4.0 extraneous
├── source-map-support@0.5.21
├── ts-jest@26.5.6
├── ts-node@9.1.1
└── typescript@3.9.10
```
