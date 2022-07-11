import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';


export class PterodactylPanelStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {vpcId: 'vpc-123456'});

    const launchConfiguration = new autoscaling.CfnLaunchConfiguration(this, 'LaunchConfiguration', {
      imageId: '',
      instanceType: ''
    });

    const scalingPolicy = new autoscaling.CfnScalingPolicy(this, 'blah', {
        autoScalingGroupName: 'pterodactyl-panel-asg',
    })

    const autoscaler = new autoscaling.AutoScalingGroup(this, 'asg', {
      vpc
    });
  }
}
