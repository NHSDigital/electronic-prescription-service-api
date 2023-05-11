resource "aws_iam_instance_profile" "github_runner" {
  name = "${local.prefix}--github-runner"
  role = aws_iam_role.github_runner.name
}


resource "aws_iam_role" "github_runner" {
  name = "${local.prefix}--github-runner"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Allow read secrets
module "github_runner_secrets" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-runner-secrets"
  role_name = aws_iam_role.github_runner.name
  iam_permissions = [
    {
      Action = [
        "secretsmanager:Get*"
      ]
      Effect = "Allow"
      Resource = [
        aws_secretsmanager_secret.github_runner_personal_access_token.arn
      ]
    }
  ]
}

# aws session manager
resource "aws_iam_role_policy_attachment" "github_runner_session_manager" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
  role       = aws_iam_role.github_runner.name
}

# aws session manager cloudwatch logs
module "github_runner_session_logs" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-runner-session-logs"
  role_name = aws_iam_role.github_runner.name
  iam_permissions = [
    {
      Action = [
        "logs:PutLogEvents",
        "logs:CreateLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
      ]
      Effect   = "Allow"
      Resource = ["*"]
    },
    {
      Action = [
        "kms:DescribeKey",
        "kms:GenerateDataKey",
        "kms:Decrypt",
        "kms:Encrypt",
      ]
      Effect = "Allow"
      Resource = [
        aws_kms_key.ec2_session_logs.arn
      ]
    }
  ]
}
