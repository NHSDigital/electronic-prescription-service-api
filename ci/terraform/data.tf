data "aws_dynamodb_table" "terraform_state_lock" {
  name = "${local.project}--terraform-state-lock"
}

data "aws_s3_bucket" "terraform_state" {
  bucket = "${local.project}--terraform-state"
}

data "aws_secretsmanager_secret" "dev_account_id" {
  name = "${local.project}--mgmt--dev-account-id"
}

data "aws_secretsmanager_secret" "test_account_id" {
  name = "${local.project}--mgmt--test-account-id"
}

data "aws_secretsmanager_secret" "prod_account_id" {
  name = "${local.project}--mgmt--prod-account-id"
}

data "aws_secretsmanager_secret" "mgmt_account_id" {
  name = "${local.project}--mgmt--mgmt-account-id"
}

data "aws_secretsmanager_secret_version" "dev_account_id" {
  secret_id = data.aws_secretsmanager_secret.dev_account_id.id
}

data "aws_secretsmanager_secret_version" "test_account_id" {
  secret_id = data.aws_secretsmanager_secret.test_account_id.id
}

data "aws_secretsmanager_secret_version" "prod_account_id" {
  secret_id = data.aws_secretsmanager_secret.prod_account_id.id
}

data "aws_secretsmanager_secret_version" "mgmt_account_id" {
  secret_id = data.aws_secretsmanager_secret.mgmt_account_id.id
}
