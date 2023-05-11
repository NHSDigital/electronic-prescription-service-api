resource "aws_iam_policy" "policy" {
  name = var.name

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = var.iam_permissions
  })
}

resource "aws_iam_role_policy_attachment" "policy_attachment" {
  role       = var.role_name
  policy_arn = aws_iam_policy.policy.arn
}
