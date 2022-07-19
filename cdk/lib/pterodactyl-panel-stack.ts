import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as iam from "aws-cdk-lib/aws-iam";
import { PterodactylOnAwsStackProps } from "./props";
import { readFileSync } from "fs";

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

    const securityGroup = new ec2.SecurityGroup(this, `${this.stackName}-SG`, {
      securityGroupName: `${this.stackName}-SG`,
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
    const role = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonEC2ContainerServiceforEC2Role"
      )
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    const userDataScript = readFileSync("./lib/user-data.sh", "utf8");
    const multipartUserData = new ec2.MultipartUserData();
    const commandsUserData = ec2.UserData.forLinux();
    multipartUserData.addUserDataPart(
      commandsUserData,
      ec2.MultipartBody.SHELL_SCRIPT,
      true
    );

    // Adding commands to the multipartUserData adds them to commandsUserData, and vice-versa.
    multipartUserData.addCommands(userDataScript);

    const autoscaler = new autoscaling.AutoScalingGroup(
      this,
      `${this.stackName}-ASG`,
      {
        vpc,
        instanceType: new ec2.InstanceType(props?.INSTANCE_TYPE || "t3a.micro"),
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
          edition: ec2.AmazonLinuxEdition.STANDARD,
          storage: ec2.AmazonLinuxStorage.EBS,
        }),
        role,
        desiredCapacity: 1,
        minCapacity: 1,
        maxCapacity: 1,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: securityGroup,
        associatePublicIpAddress: true,
        userData: multipartUserData,
      }
    );
    autoscaler.addSecurityGroup(securityGroup);
  }
}
