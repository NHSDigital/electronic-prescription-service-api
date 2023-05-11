resource "aws_iam_role" "github_prod_deploy" {
  name = "${local.prefix}--github-prod-deploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_action.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:NHSDigital/NRLF:main"
          }
        }
      }
    ]
  })
}

module "github_prod_deploy_tf_state" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-prod-deploy-tf-state"
  role_name = aws_iam_role.github_prod_deploy.name
  iam_permissions = [
    {
      Action = [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "s3:ListBucket"
      ]
      Effect = "Allow"
      Resource = [
        data.aws_dynamodb_table.terraform_state_lock.arn,
        data.aws_s3_bucket.terraform_state.arn,
        "${data.aws_s3_bucket.terraform_state.arn}/*"
      ]
    }
  ]
}

module "github_prod_deploy_tf_assume_role" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-prod-deploy-tf-assume-role"
  role_name = aws_iam_role.github_prod_deploy.name
  iam_permissions = [
    {
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Resource = [
        "arn:aws:iam::${data.aws_secretsmanager_secret_version.prod_account_id.secret_string}:role/terraform"
      ]
    }
  ]
}

module "github_prod_deploy_read_account_id" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-prod-deploy-get-account-id"
  role_name = aws_iam_role.github_prod_deploy.name
  iam_permissions = [
    {
      Action = [
        "secretsmanager:GetResourcePolicy",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds"
      ]
      Effect = "Allow"
      Resource = [
        data.aws_secretsmanager_secret.prod_account_id.arn
      ]
    }
  ]
}

module "github_prod_deploy_write_ci_logs" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-prod-deploy-write-ci-logs"
  role_name = aws_iam_role.github_prod_deploy.name
  iam_permissions = [
    {
      Action = [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      Effect = "Allow"
      Resource = [
        aws_s3_bucket.github_ci_logging.arn,
        "${aws_s3_bucket.github_ci_logging.arn}/*"
      ]
    }
  ]
}
