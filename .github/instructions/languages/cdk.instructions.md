---
description: 'Guidelines for writing, reviewing, and maintaining AWS CDK (TypeScript) code in the cdk package'
applyTo: 'packages/cdk/**/*.ts'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

# AWS CDK TypeScript Development

This file provides instructions for generating, reviewing, and maintaining AWS CDK code in the `packages/cdk` folder. It covers best practices, code standards, architecture, and validation for infrastructure-as-code using AWS CDK in TypeScript.

## General Instructions

- Use AWS CDK v2 constructs and idioms
- Prefer high-level CDK constructs over raw CloudFormation resources
- Organize code by logical infrastructure components (e.g., stacks, constructs, resources)
- Document public APIs and exported constructs

## Best Practices

- Use environment variables and context for configuration, not hardcoded values
- Use CDK Aspects for cross-cutting concerns (e.g., security, tagging)
- Suppress warnings with `nagSuppressions.ts` only when justified and documented
- Use `bin/` for entrypoint apps, `constructs/` for reusable components, and `stacks/` for stack definitions
- Prefer `props` interfaces for construct configuration

## Code Standards

### Naming Conventions

- Classes: PascalCase (e.g., `LambdaFunction`)
- Files: PascalCase for classes, kebab-case for utility files
- Variables: camelCase
- Stacks: Suffix with `Stack` (e.g., `CptsApiAppStack`)
- Entry points: Suffix with `App` (e.g., `CptsApiApp.ts`)

### File Organization

- `bin/`: CDK app entry points
- `constructs/`: Custom CDK constructs
- `stacks/`: Stack definitions
- `resources/`: Resource configuration and constants
- `lib/`: Shared utilities and code

## Common Patterns

### Good Example - Defining a Construct

```typescript
export class LambdaFunction extends Construct {
  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);
    // ...implementation...
  }
}
```

### Bad Example - Using Raw CloudFormation

```typescript
const lambda = new cdk.CfnResource(this, 'Lambda', {
  type: 'AWS::Lambda::Function',
  // ...properties...
});
```

### Good Example - Stack Definition

```typescript
export class CptsApiAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // ...add constructs...
  }
}
```

## Security

- Use least privilege IAM policies for all resources
- Avoid wildcard permissions in IAM statements
- Store secrets in AWS Secrets Manager, not in code or environment variables
- Enable encryption for all data storage resources

## Performance

- Use provisioned concurrency for Lambda functions when needed
- Prefer VPC endpoints for private connectivity
- Minimize resource creation in test environments


## Validation and Verification

- Build: `make cdk-synth`
- Lint: `npm run lint --workspace packages/cdk`

## Maintenance

- Update dependencies regularly
- Remove deprecated constructs and suppressions
- Document changes in `nagSuppressions.ts` with reasons

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [CDK Best Practices](https://github.com/aws-samples/aws-cdk-best-practices)
