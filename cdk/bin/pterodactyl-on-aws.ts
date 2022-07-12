#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PterodactylOnAwsStack } from '../lib/pterodactyl-on-aws-stack';

const app = new cdk.App();
new PterodactylOnAwsStack(app, 'PterodactylOnAwsStack', {
  env: {
    account: app.account,
    region: app.region
  },
  VPC_ID: 'vpc-123456'
});