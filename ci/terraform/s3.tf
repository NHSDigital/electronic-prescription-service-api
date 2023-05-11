resource "aws_s3_bucket" "github_ci_logging" {
  bucket = "${local.prefix}--github-ci-logging"
}

resource "aws_s3_bucket_acl" "github_ci_logs" {
  bucket = aws_s3_bucket.github_ci_logging.id
  acl    = "private"

  depends_on = [
    aws_s3_bucket.github_ci_logging
  ]
}

resource "aws_s3_bucket_public_access_block" "github_ci_logging" {
  bucket = aws_s3_bucket.github_ci_logging.id

  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
  ignore_public_acls      = true

  depends_on = [
    aws_s3_bucket.github_ci_logging
  ]
}

resource "aws_s3_bucket_versioning" "github_ci_logs" {
  bucket = aws_s3_bucket.github_ci_logging.id
  versioning_configuration {
    status = "Enabled"
  }

  depends_on = [
    aws_s3_bucket.github_ci_logging
  ]
}
