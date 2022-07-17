import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as iam from "aws-cdk-lib/aws-iam";
import { PterodactylOnAwsStackProps } from "./props";

export class PanelStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: PterodactylOnAwsStackProps
  ) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 3,
      cidr: "10.0.0.0/16",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "protected",
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, `${this.stackName}-sg`, {
      securityGroupName: `${this.stackName}-sg`,
      description: "Pterodactyl Panel Security Group",
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS"
    );

    const autoscaler = new autoscaling.AutoScalingGroup(
      this,
      `${this.stackName}-asg`,
      {
        vpc,
        instanceType: new ec2.InstanceType(props?.INSTANCE_TYPE || "t3a.micro"),
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
          edition: ec2.AmazonLinuxEdition.STANDARD,
          storage: ec2.AmazonLinuxStorage.EBS,
        }),
        role: new iam.Role(this, "InstanceRole", {
          assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
            ),
          ],
        }),
        desiredCapacity: 1,
        minCapacity: 1,
        maxCapacity: 1,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: securityGroup,
        associatePublicIpAddress: true,
      }
    );
    autoscaler.addSecurityGroup(securityGroup);
  }
}
