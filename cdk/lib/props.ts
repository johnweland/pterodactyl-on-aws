import { StackProps } from 'aws-cdk-lib';

export interface PterodactylOnAwsStackProps extends StackProps {
    VPC_ID: string
}