resource "aws_iam_role" "github_ci" {
  name = "${local.prefix}--github-ci"
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
          StringLike = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:NHSDigital/Prescriptions:*"
          }
        }
      }
    ]
  })
}

module "github_ci_tf_state" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-ci-tf-state"
  role_name = aws_iam_role.github_ci.name
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

module "github_ci_tf_assume_role" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-ci-tf-assume-role"
  role_name = aws_iam_role.github_ci.name
  iam_permissions = [
    {
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Resource = [
        "arn:aws:iam::${data.aws_secretsmanager_secret_version.dev_account_id.secret_string}:role/terraform",
        "arn:aws:iam::${data.aws_secretsmanager_secret_version.test_account_id.secret_string}:role/terraform",
        "arn:aws:iam::${data.aws_secretsmanager_secret_version.prod_account_id.secret_string}:role/terraform"
      ]
    }
  ]
}

module "github_ci_read_account_id" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-ci-get-account-id"
  role_name = aws_iam_role.github_ci.name
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
        data.aws_secretsmanager_secret.dev_account_id.arn,
        data.aws_secretsmanager_secret.test_account_id.arn,
        data.aws_secretsmanager_secret.prod_account_id.arn
      ]
    }
  ]
}

module "github_ci_write_ci_logs" {
  source    = "./role-policy"
  name      = "${local.prefix}--github-ci-write-ci-logs"
  role_name = aws_iam_role.github_ci.name
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
