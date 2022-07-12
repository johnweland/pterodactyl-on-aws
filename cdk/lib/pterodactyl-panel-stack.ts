import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';


export class PanelStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: 'protected',
          subnetType: ec2.SubnetType.PUBLIC,
        }],
    });
    const launchConfiguration = new autoscaling.CfnLaunchConfiguration(this, 'LaunchConfiguration', {
      imageId: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2022,
        edition: ec2.AmazonLinuxEdition.STANDARD,
        storage: ec2.AmazonLinuxStorage.EBS,
      }).getImage(this).imageId,
      instanceType: 't4.micro',
      associatePublicIpAddress: true,
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 50,
            volumeType: 'gp3',
            deleteOnTermination: true,
            encrypted: true,
          },
        }
      ],
      ebsOptimized: true
    });

    const scalingPolicy = new autoscaling.CfnScalingPolicy(this, `${this.stackName}-asg-policy`, {
        autoScalingGroupName: 'pterodactyl-panel-asg',
    })

    const autoscaler = new autoscaling.AutoScalingGroup(this, `${this.stackName}-asg`, {
      vpc,
    });
  }
}
