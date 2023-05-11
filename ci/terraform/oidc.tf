resource "aws_iam_openid_connect_provider" "github_action" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = var.oidc_thumbprints
}
