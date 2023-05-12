provider "aws" {
  region = local.region
  default_tags {
    tags = {
      project_name = local.project
      workspace    = terraform.workspace
    }
  }

}

terraform {
  backend "s3" {
    encrypt              = false
    region               = "eu-west-2"
    bucket               = "nhsd-prescriptions--terraform-state"
    dynamodb_table       = "nhsd-prescriptions--terraform-state-lock"
    key                  = "terraform-state-ci"
    workspace_key_prefix = "nhsd-prescriptions"
  }
}
