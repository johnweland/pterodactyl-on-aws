import { aws_elasticloadbalancingv2, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';


export class PanelStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const instanceRole = new iam.Role(this, `${this.stackName}-InstanceRole`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    instanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2RoleforSSM'));

    const vpc = new ec2.Vpc(this, `${this.stackName}-vpc`, {
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 16,
          name: 'protected',
          subnetType: ec2.SubnetType.PUBLIC,
        }],
    });

    const sg = new ec2.SecurityGroup(this, `${this.stackName}-sg`, {
      vpc,
      allowAllOutbound: true,
      description: 'Pterodactyl Panel Security Group',
    });

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const asg = new autoscaling.AutoScalingGroup(this, 'PanelASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      maxCapacity:1,
      minCapacity:1,
      desiredCapacity:1,
      role: instanceRole
    })
    asg.addUserData();
    asg.addSecurityGroup(sg);

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, `${this.stackName}-lb`, {
      vpc,
      internetFacing: true,
    });

    const httpListener = loadBalancer.addListener('Listener', {
      port: 80,
      open: true,
    });
    httpListener.addTargets('Target', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
    });

    const httpsListener = loadBalancer.addListener('Listener', {
      port: 443,
      open: true,
    });
    httpsListener.addTargets('Target', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
    });

    new CfnOutput(this, `${this.stackName}-panelURL`, {value: loadBalancer.loadBalancerDnsName!});
  }
}
