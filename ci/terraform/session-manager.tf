resource "aws_ssm_document" "session_manager_prefs" {
  name            = "SSM-SessionManagerRunShell"
  document_type   = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Document to hold settings for Session Manager"
    sessionType   = "Standard_Stream"
    inputs = {
      cloudWatchLogGroupName      = aws_cloudwatch_log_group.ec2_session.name
      cloudWatchEncryptionEnabled = true
      kmsKeyId                    = aws_kms_key.ec2_session_logs.key_id
    }
  })
}
