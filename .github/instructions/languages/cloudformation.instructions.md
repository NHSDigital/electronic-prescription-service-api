---
description: 'Guidelines for writing, reviewing, and maintaining cloudformation templates'
applyTo: 'cloudformation/**'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

## General
- Prefer YAML (not JSON). Follow existing style in [cloudformation/account_resources.yml](cloudformation/account_resources.yml), [cloudformation/ci_resources.yml](cloudformation/ci_resources.yml), [cloudformation/artillery_resources.yml](cloudformation/artillery_resources.yml), [cloudformation/account_resources_bootstrap.yml](cloudformation/account_resources_bootstrap.yml), [cloudformation/management.yml](cloudformation/management.yml).
- Always start with `AWSTemplateFormatVersion: "2010-09-09"`.
- Keep descriptions concise (> operator used only for multi‑line).
- Use logical region `eu-west-2` unless cross‑region behavior explicitly required.
- Maintain tagging pattern: version, stack, repo, cfnDriftDetectionGroup (see deployment scripts in [.github/scripts/release_code.sh](.github/scripts/release_code.sh) and [.github/scripts/create_changeset_existing_tags.sh](.github/scripts/create_changeset_existing_tags.sh)).

## Parameters
- Reuse and align parameter naming with existing templates: `LogRetentionDays`, `Env`, `SplunkHECEndpoint`, `DeployDriftDetection`.
- For numeric retention days replicate allowed values list from [SAMtemplates/lambda_resources.yaml](SAMtemplates/lambda_resources.yaml) or [cloudformation/account_resources.yml](cloudformation/account_resources.yml).
- Use `CommaDelimitedList` for OIDC subject claim filters like in [cloudformation/ci_resources.yml](cloudformation/ci_resources.yml).

## Conditions
- Follow pattern `ShouldDeployDriftDetection` (see [SAMtemplates/lambda_resources.yaml](SAMtemplates/lambda_resources.yaml)); avoid ad‑hoc condition names.
- If creating a never-used placeholder stack use pattern from [cloudformation/empty_stack.yml](cloudformation/empty_stack.yml).

## IAM Policies
- Split large CloudFormation execution permissions across multiple managed policies (A, B, C, D) to keep each rendered size < 6144 chars (see check logic in [scripts/check_policy_length.py](scripts/check_policy_length.py)).
- Scope resources minimally; prefer specific ARNs (e.g. logs, KMS aliases) as in [cloudformation/account_resources.yml](cloudformation/account_resources.yml).
- When granting CloudFormation execution access: separate IAM‑focused policy (`GrantCloudFormationExecutionAccessIAMPolicy`) from broad service policies.
- Use exports for policy ARNs with naming `ci-resources:GrantCloudFormationExecutionAccessPolicyA` pattern.

## KMS
- Alias naming: `alias/CloudwatchLogsKmsKeyAlias`, `alias/SecretsKMSKeyAlias`, `alias/ArtifactsBucketKMSKeyAlias` (see [cloudformation/account_resources.yml](cloudformation/account_resources.yml), [cloudformation/account_resources_bootstrap.yml](cloudformation/account_resources_bootstrap.yml)).
- Grant encrypt/decrypt explicitly for principals (e.g. API Gateway, Lambda) mirroring key policy blocks in [cloudformation/account_resources.yml](cloudformation/account_resources.yml).

## Secrets / Parameters
- SecretsManager resources must depend on alias if needed (`DependsOn: SecretsKMSKeyKMSKeyAlias`) like in [cloudformation/account_resources_bootstrap.yml](cloudformation/account_resources_bootstrap.yml).
- Export secret IDs (not ARNs unless specifically required) using colon-separated naming with stack name (pattern in outputs section of account templates).
- Default placeholder value `ChangeMe` for bootstrap secrets.

## S3 Buckets
- Apply `PublicAccessBlockConfiguration` and encryption blocks consistent with [cloudformation/account_resources.yml](cloudformation/account_resources.yml).
- Suppress guard rules using `Metadata.guard.SuppressedRules` where legacy exceptions exist (e.g. replication / logging) matching existing patterns.

## Lambda / SAM
- Shared lambda resources belong in SAM template ([SAMtemplates/lambda_resources.yaml](SAMtemplates/lambda_resources.yaml)); CloudFormation templates should not duplicate build-specific metadata.
- Suppress cfn-guard rules where justified via `Metadata.guard.SuppressedRules` (e.g. `LAMBDA_INSIDE_VPC`, `LAMBDA_CONCURRENCY_CHECK`) only if precedent exists.

## Exports & Cross Stack
- Output export naming pattern: `!Join [":", [!Ref "AWS::StackName", "ResourceLogicalName"]]`.
- Reference exports via `!ImportValue stack-name:ExportName` (see Proxygen role usage in [SAMtemplates/lambda_resources.yaml](SAMtemplates/lambda_resources.yaml)).
- Avoid changing existing export names (breaking downstream stacks and scripts).

## OIDC / Roles
- Federated trust for GitHub actions must use conditions:
  - `token.actions.githubusercontent.com:aud: sts.amazonaws.com`
  - `ForAnyValue:StringLike token.actions.githubusercontent.com:sub: <ClaimFilters>`
  (pattern in roles inside [cloudformation/ci_resources.yml](cloudformation/ci_resources.yml)).
- When adding a new OIDC role add matching parameter `<RoleName>ClaimFilters` and outputs `<RoleName>` and `<RoleName>Name`.

## Drift Detection
- Tag stacks with `cfnDriftDetectionGroup` (deployment scripts handle this). Config rules should filter on `TagKey: cfnDriftDetectionGroup` and specific `TagValue` (patterns in [SAMtemplates/lambda_resources.yaml](SAMtemplates/lambda_resources.yaml)).
- Avoid duplicating rule identifiers; follow `${AWS::StackName}-CloudFormationDriftDetector-<Group>`.

## Route53
- Environment hosted zones template ([cloudformation/eps_environment_route53.yml](cloudformation/eps_environment_route53.yml)) uses parameter `environment`; management template updates NS records referencing environment zones.

## Style / Lint / Guard
- Keep resources grouped with `#region` / `#endregion` comments as in existing templates for readability.
- Use `Metadata.cfn-lint.config.ignore_checks` only when upstream spec mismatch (example: W3037 in large policy templates).
- Ensure new templates pass `make lint-cloudformation` and `make cfn-guard` (scripts: [scripts/run_cfn_guard.sh](scripts/run_cfn_guard.sh)).

## Naming Conventions
- Logical IDs: PascalCase (`ArtifactsBucketKMSKey`, `CloudFormationDeployRole`).
- Managed policy logical IDs end with `Policy` or `ManagedPolicy`.
- KMS Key alias logical IDs end with `Alias` (e.g. `CloudwatchLogsKmsKeyAlias`).
- Secrets logical IDs end with `Secret`.

## Security
- Block public access for all buckets unless explicitly required.
- Encrypt logs with KMS key; provide alias export (see `CloudwatchLogsKmsKeyAlias`).
- Limit wildcard `Resource: "*"` where service requires (e.g. some IAM, CloudFormation actions). Prefer service/resource ARNs otherwise.

## When Adding New Resource Types
- Update execution policies in [cloudformation/ci_resources.yml](cloudformation/ci_resources.yml) minimally; do not expand existing broad statements unnecessarily.
- Run policy length check (`make test` invokes [scripts/check_policy_length.py](scripts/check_policy_length.py)) after modifications.

## Do Not
- Do not hardcode account IDs; use `${AWS::AccountId}`.
- Do not remove existing exports or rename keys.
- Do not inline large policy statements in a single managed policy if size risk exists.

## Examples
- IAM Role with OIDC trust: replicate structure from `CloudFormationDeployRole` in [cloudformation/ci_resources.yml](cloudformation/ci_resources.yml).
- KMS key + alias + usage policy: follow `ArtifactsBucketKMSKey` block in [cloudformation/account_resources.yml](cloudformation/account_resources.yml).

## Testing
- After changes: run `make lint-cloudformation` and `make cfn-guard`.
- For SAM-related cross-stack exports ensure `sam build` (see [Makefile](Makefile)) passes.

## Automation Awareness
- Deployment scripts expect unchanged parameter names & export patterns (see [.github/scripts/execute_changeset.sh](.github/scripts/execute_changeset.sh), [.github/scripts/release_code.sh](.github/scripts/release_code.sh)).
- Changes to tagging keys must be reflected in release / changeset scripts; avoid unless necessary.

## Preferred Patterns Summary
- Exports: colon join
- Tags: version, stack, repo, cfnDriftDetectionGroup
- Conditions: prefixed with `Should`
- Claim filter parameters: `<RoleName>ClaimFilters`
- Secrets: depend on KMS alias, default `ChangeMe`

Use these rules to guide completions for any new or modified CloudFormation template in this repository.
