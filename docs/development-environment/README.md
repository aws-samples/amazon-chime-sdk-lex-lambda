# Setting Up a Development Environment for PSTN Audio

The sample code in this workshop is designed to be used at the command line and makes heavy use of a set of common tools.  You will need to install the [AWS Command Line Interface (CLI)](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [jq](https://stedolan.github.io/jq/download/) and [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm).  You can then use nvm to install the other dependendencies (nodejs typescript aws-sdk aws-cdk).  While these can all be installed on Windows, they are native to POSIX environments like MacOS and especially Linux.  

You can create a development environment manually, with a few steps, or automatically.  Both are detailed below.

## AWS Account (Launch Host)

To run any of these workships, you need to configure your AWS Account parameters to enable deploying the application. The easiest way to ensure that you have it configured properly do this:

```bash
aws sts get-caller-identity
```

You should get information about your valid AWS account if it is configured properly.  

You will also need to login to the AWS Console to review details discussed in various of these workshops.

## Setting Things Up Locally:  Amazon Linux

If you are using [Amazon Linux](https://aws.amazon.com/amazon-linux-2/?amazon-linux-whats-new.sort-by=item.additionalFields.postDateTime&amazon-linux-whats-new.sort-order=desc), you can create a script from the following shell commands that should install the dependencies.  This could be your own system, or a cloud instance on [AWS Elastic Computing (EC2)](https://aws.amazon.com/pm/ec2/?trk=36c6da98-7b20-48fa-8225-4784bced9843&sc_channel=ps&sc_campaign=acquisition&sc_medium=ACQ-P|PS-GO|Brand|Desktop|SU|Compute|EC2|US|EN|Text&s_kwcid=AL!4422!3!488982705492!e!!g!!aws%20ec2&ef_id=CjwKCAjwiuuRBhBvEiwAFXKaNO5X8_DIXPbR4BUzxeyPIUf_YrrKz05d14kP-jhSOheq2D6UkjKaZBoC0ZMQAvD_BwE:G:s&s_kwcid=AL!4422!3!488982705492!e!!g!!aws%20ec2), [AWS Cloud9](https://aws.amazon.com/cloud9/), or [Amazon WorkSpaces](https://www.amazonaws.cn/en/workspaces/).

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -Rf aws
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
cat << EOF >> /home/ec2-user/.bash_profile
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
source /home/ec2-user/.bash_profile
nvm install 16
nvm use 16
npm install -g npm nodejs typescript aws-sdk aws-cdk
```

However, always refer to the documentation for all relevant packages for installation instructions.

## Automation:  Deploy a Fully Configured EC2 Development Instance in Minutes

Many customers have asked how to create an EC2 development instance.  One easy way to get such an instance is to use the ["Single EC2 Instance"](https://github.com/aws-samples/single-ec2-cdk) [AWS Cloud Development Kit (CDK)](https://aws.amazon.com/cdk/) tool to automatically create your development environment.  All of the above steps are done automatically when you create the instance, including installing your SSH keys and preparing your SSH configuration to make it easy to use [Visual Studio Code](https://code.visualstudio.com/) to connect remotely to the instance.

