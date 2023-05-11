resource "aws_secretsmanager_secret" "github_runner_personal_access_token" {
  name = "${local.prefix}--github-personal-access-token"
}
