variable "stack_name" {
  description = "The name defining your stack in AWS"
  type =  string
  default = "pterodactyl_panel_stack"
}

variable "instance_type" {
  description = "The desired EC2 instance type"
  type = string
  default = "t3a.micro"
}

variable "http_port" {
  description = "HTTP port"
  type = number
  default = 80
}

variable "https_port" {
  description = "HTTPS port"
  type = number
  default = 443
}

variable "cluster_name" {
  type        = string
  description = "ECS cluster name"
}