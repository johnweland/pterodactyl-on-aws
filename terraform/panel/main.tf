terraform {
    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "~> 4.16"
        }
    }
    required_version = ">=1.2.0"
}


resource "aws_autoscaling_group" "asg" {
    name = "${var.stack_name}-asg"
    desired_capacity = 1
    min_size = 1
    max_size = 1
    termination_policies = ["OldestInstance"]

    launch_template {
      id = aws_launch_template.template.id
      version = "$Latest"
    }
}

resource "aws_launch_template" "template" {
    name = "${var.stack_name}-asg-template"
    instance_type = var.instance_type
    image_id = data.aws_ami.ami.id
    ebs_optimized = true
    vpc_security_group_ids = [aws_security_group.ec2_secgrp.id]

    credit_specification {
      cpu_credits = "standard"
    }

    iam_instance_profile {
      arn = aws_iam_instance_profile.iam_profile.arn
    }

    tag_specifications {
      resource_type = "instance"
      tags = {
        Name = "${var.stack_name}-instance"
        Source = "Autoscaling"
      }
    }
}

resource "aws_security_group" "ec2_secgrp" {
    name = "${var.stack_name}-sg"
    description = ""
    vpc_id = aws_default_vpc.default_vpc.id

    ingress {
        from_port =  var.http_port
        to_port = var.http_port
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        from_port =  var.https_port
        to_port = var.https_port
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }
    
    egress {
      from_port = 0
      to_port = 0
      protocol = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }

    tags = local.tags
}

resource "aws_default_vpc" "default_vpc" {
  
}

resource "aws_iam_instance_profile" "iam_profile" {
    name = "${var.stack_name}-instance-profile"
    role = aws_iam_role.iam_role.name
}

resource "aws_iam_role" "iam_role" {
  name = "${var.stack_name}-iam-role"
  assume_role_policy = data.aws_iam_policy_document.assume_policy.json
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ]
}