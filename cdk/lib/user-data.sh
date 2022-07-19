#!/bin/bash
sudo yum update && sudo yum upgrade -y

# Check if the AWS SSM agent is installed
if [ ! -f /usr/local/bin/aws-ssm-agent ]; then
  echo "Installing AWS SSM agent"
  sudo yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
  sudo systemctl enable amazon-ssm-agent
  sudo systemctl start amazon-ssm-agent
fi