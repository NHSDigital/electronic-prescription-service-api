resource "aws_security_group" "github_runner" {
  name        = "${local.prefix}--github-runner"
  description = "security group for github runner"
  vpc_id      = aws_vpc.github_runner.id

  ingress = []

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_launch_configuration" "github_runner" {
  name_prefix   = "${local.prefix}--github-runner"
  image_id      = var.github_runner_ami
  instance_type = "t3.small"
  security_groups = [
    aws_security_group.github_runner.id
  ]
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  iam_instance_profile        = aws_iam_instance_profile.github_runner.name
  associate_public_ip_address = false
  user_data = templatefile("./launch_config_user_data.sh.tpl", {
    secret_id = aws_secretsmanager_secret.github_runner_personal_access_token.name
  })
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "github_runner" {
  name                 = "${local.prefix}--github-runner"
  launch_configuration = aws_launch_configuration.github_runner.name
  min_size             = var.github_runner_count
  max_size             = var.github_runner_count
  desired_capacity     = var.github_runner_count
  vpc_zone_identifier = [
    module.private_subnets.ids["private_a"],
    module.private_subnets.ids["private_b"],
    module.private_subnets.ids["private_c"]
  ]

  tag {
    key                 = "Name"
    value               = "${local.prefix}--github-runner"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}
