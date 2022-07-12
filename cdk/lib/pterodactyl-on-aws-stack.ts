import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { PterodactylOnAwsStackProps } from './props'


export class PterodactylOnAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: PterodactylOnAwsStackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {vpcId: props?.VPC_ID});

    const launchConfiguration = new autoscaling.CfnLaunchConfiguration(this, 'LaunchConfiguration', {
      imageId: '',
      instanceType: ''
    });

    const scalingPolicy = new autoscaling.CfnScalingPolicy(this, 'blah', {autoScalingGroupName: props?.stackName + '-scalingPolicy'})

    const asg = new autoscaling.AutoScalingGroup(this, 'asg', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: new ec2.AmazonLinuxImage(),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      desiredCapacity: 1,
      minCapacity: 1,
      maxCapacity: 2
    });
  }
}
