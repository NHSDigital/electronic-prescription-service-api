locals {
  project     = "nhsd-prescriptions"
  region      = "eu-west-2"
  environment = terraform.workspace
  prefix      = "${local.project}--${local.environment}"
  vpc_cidr    = "173.31.0.0/16"
}
