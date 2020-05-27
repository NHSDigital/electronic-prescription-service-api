provider "apigee" {
  org          = var.apigee_organization
  access_token = var.apigee_token
}

terraform {
  backend "azurerm" {}

  required_providers {
    apigee = "~> 0.0"
    archive = "~> 1.3"
  }
}

module "electronic-prescription-service-api" {
  source             = "github.com/NHSDigital/api-platform-service-module?ref=apm-501-change-proxy-location"
  name               = "electronic-prescription-service-api"
  path               = "electronic-prescriptions"
  apigee_environment = var.apigee_environment
  proxy_type         = "sandbox"
  namespace          = var.namespace
}
