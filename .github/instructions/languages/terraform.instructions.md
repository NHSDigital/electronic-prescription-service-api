---
description: 'Comprehensive guidelines for writing, organizing, and maintaining Terraform code in this repository.'
applyTo: 'terraform/**/*.tf'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

# Terraform Development Guidelines

This document provides best practices and conventions for writing, organizing, and maintaining Terraform code. It is intended for use by developers and GitHub Copilot to ensure consistency, reliability, and maintainability across all Terraform files in the project.

## General Instructions

- Use Terraform modules to promote code reuse and separation of concerns.
- Keep resource definitions declarative and avoid imperative logic.
- Store environment-specific configuration in separate files (e.g., `env/` folders).
- Use variables and outputs to parameterize and expose configuration.
- Document resources, modules, and variables with comments.
- Prefer explicit resource dependencies using `depends_on` when needed.
- Use remote state for shared resources and outputs.

## Best Practices

- Group related resources in logical subfolders (e.g., `archive/`, `backup-source/`).
- Use `locals` for computed values and to reduce repetition.
- Use data sources to reference existing infrastructure.
- Avoid hardcoding values; use variables and environment files.
- Use `terraform fmt` to enforce consistent formatting.
- Use `terraform validate` and `terraform plan` before applying changes.
- Use `Makefile` targets for common operations (init, plan, apply, destroy).
- Store secrets and sensitive values in secure locations (e.g., AWS SSM, environment variables), not in code.
- Use resource tags for traceability and cost management.
- Prefer resource names that include environment and purpose (e.g., `archive_prod_bucket`).

## Code Standards

### Naming Conventions

- Use snake_case for resource, variable, and output names.
- Prefix resource names with their type and purpose (e.g., `s3_archive_bucket`).
- Use clear, descriptive names for modules and files.
- Use consistent naming for environments (e.g., `dev`, `prod`, `test`).

### File Organization

- Place each environment's configuration in its own file under `env/`.
- Use a `variables.tf` file for input variables.
- Use an `outputs.tf` file for outputs.
- Use a `locals.tf` file for local values.
- Use a `provider.tf` file for provider configuration.
- Use a `Makefile` for automation and common tasks.
- Organize resources by domain (e.g., `archive/`, `infra/`, `storage/`).

## Common Patterns

### Using Variables

```hcl
variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

resource "aws_s3_bucket" "archive" {
  bucket = var.bucket_name
  ...
}
```

### Using Locals

```hcl
locals {
  tags = {
    Environment = var.environment
    Project     = "eps-storage"
  }
}

resource "aws_s3_bucket" "archive" {
  tags = local.tags
  ...
}
```

### Good Example - Using Modules

```hcl
module "archive" {
  source      = "../modules/aws-archive"
  environment = var.environment
  ...
}
```

### Bad Example - Hardcoding Values

```hcl
resource "aws_s3_bucket" "archive" {
  bucket = "my-hardcoded-bucket-name"
  ...
}
```

## Security

- Never commit secrets or credentials to version control.
- Use IAM roles and policies with least privilege.
- Enable encryption for all supported resources (e.g., S3, KMS, DynamoDB).
- Use secure remote state backends (e.g., S3 with encryption and locking).
- Validate input variables for expected values and types.

## Performance

- Use resource lifecycle rules to manage retention and cleanup.
- Use data sources to avoid duplicating resources.
- Minimize resource drift by keeping code and infrastructure in sync.
- Use `terraform plan` to preview changes and avoid unnecessary updates.

## Testing

- Use `terraform validate` to check syntax and configuration.
- Use `terraform plan` to preview changes before applying.
- Use `tfsec` for static security analysis (`tfsec.yml` config).
- Use automated CI/CD pipelines for deployment and testing.

## Validation and Verification

- Format code: `terraform fmt` (run in each Terraform folder)
- Validate code: `terraform validate`
- Security scan: `tfsec .`
- Plan changes: `terraform plan -var-file=env/dev.tfvars.json`
- Apply changes: `terraform apply -var-file=env/dev.tfvars.json`

## Maintenance

- Review and update modules and dependencies regularly.
- Remove unused resources and variables.
- Update environment files as infrastructure evolves.
- Keep documentation up to date.
- Refactor code to improve readability and maintainability.

## Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [tfsec Security Scanner](https://tfsec.dev/)
