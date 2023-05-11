resource "aws_cloudwatch_log_group" "ec2_session" {
  name       = "${local.prefix}--ec2-session"
  kms_key_id = aws_kms_key.ec2_session_logs.arn
}
