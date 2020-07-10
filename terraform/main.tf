provider "apigee" {
    org = var.apigee_organization
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
    source = "github.com/NHSDigital/api-platform-service-module"
    name = "electronic-prescription-service-api"
    path = "electronic-prescriptions"
    apigee_environment = var.apigee_environment
    proxy_type = (var.force_sandbox || length(regexall("sandbox", var.apigee_environment)) > 0) ? "sandbox" : "live"
    namespace = var.namespace
    make_api_product = !(length(regexall("sandbox", var.apigee_environment)) > 0)
    api_product_display_name = length(var.namespace) > 0 ? "electronic-prescriptions${var.namespace}" : "Electronic Prescription Service"
    api_product_description = ""
}
