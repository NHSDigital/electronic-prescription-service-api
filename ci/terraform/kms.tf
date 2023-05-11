resource "aws_kms_key" "ec2_session_logs" {
  policy = data.aws_iam_policy_document.ec2_session_logs.json
}

resource "aws_kms_alias" "ec2_session_logs" {
  name          = "alias/${local.prefix}--ec2-session-logs"
  target_key_id = aws_kms_key.ec2_session_logs.key_id
}


data "aws_iam_policy_document" "ec2_session_logs" {
  statement {
    sid = "KMS Key Default"
    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${data.aws_secretsmanager_secret_version.mgmt_account_id.secret_string}:root"
      ]
    }
    actions = [
      "kms:*",
    ]
    resources = ["*"]
  }

  statement {
    sid = "CloudWatchLogsEncryption"
    principals {
      type = "Service"
      identifiers = [
        "logs.eu-west-2.amazonaws.com"
      ]
    }
    actions = [
      "kms:Encrypt*",
      "kms:Decrypt*",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Describe*",
    ]

    resources = ["*"]
  }

}
