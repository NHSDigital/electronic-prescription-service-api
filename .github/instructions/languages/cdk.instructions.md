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
- For Step Functions definitions, prefer a chain-centric style where states are defined inline within `Chain.start(...).next(...)` so the execution flow reads top-to-bottom in one place. Avoid mixing a chain with many separately declared state `const`s; instead embed calls to helper functions directly in the chain when needed.
- For Step Functions chain formatting, place `.start`, `.next`, `.when`, and `.otherwise` on their own lines, and give helper calls such as `.jsonata(...)` the same line-break weight so nested flow blocks are visually aligned and easy to scan.
- For construct props that group resources (for example lambda functions or state machines), prefer explicit named object shapes (e.g. `{status: TypescriptLambdaFunction}`) over generic index signatures or broad maps so consumers are strongly typed to only the supported resources.
- For construct props that consume grouped resources, prefer inline explicit object shapes in the props contract (for example `functions: { status: TypescriptLambdaFunction }`) over `Pick<...>` or generic map types.

### Good Example - Inline Explicit Shape

```typescript
interface ApisProps {
  readonly functions: {
    readonly status: TypescriptLambdaFunction
  }
  readonly stateMachines: {
    readonly getMyPrescriptions: ExpressStateMachine
  }
}
```

### Bad Example - Hidden Contract via Pick

```typescript
interface ApisProps {
  readonly functions: Pick<FunctionResources, "status" | "capabilityStatement">
}
```

### Bad Example - Generic Map

```typescript
interface ApisProps {
  functions: {[key: string]: TypescriptLambdaFunction}
  stateMachines: {[key: string]: ExpressStateMachine}
}
```

## Code Standards

### Naming Conventions

- Classes: PascalCase (e.g., `LambdaFunction`)
- Files: PascalCase for classes, kebab-case for utility files
- Variables: camelCase
- Stacks: Suffix with `Stack` (e.g., `CptsApiAppStack`)
- Entry points: Suffix with `App` (e.g., `CptsApiApp.ts`)
- CDK app entry points must follow `<app acronym><Api|Ui>[Sandbox]App` naming (e.g., `PsuApiApp`, `PsuApiSandboxApp`)

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

## Unit Testing

- Write unit tests for CDK stacks and constructs using synthesis-based assertions.
- Prefer in-process tests that instantiate CDK `App` and `Stack` objects directly and assert on synthesized templates.
- Keep assertions light-touch and stable, such as resource counts and a small number of important properties.
- Avoid mocking AWS resources or writing tests that attempt to exercise live AWS behaviour.
- CDK constructs suitable for reuse should be placed in `eps-cdk-utils` repo.
- Do not test AWS implementation details owned by the CDK library. Test the resources and properties your code is responsible for declaring.

### Recommended Test Styles

- Smoke tests for `bin/` files: execute the entrypoint and assert that synthesis completes without throwing.
- In-process synth tests for stacks and constructs: instantiate the stack directly and assert resource counts or key CloudFormation properties with `Template.fromStack(...)`.


## Validation and Verification

- Build: `make cdk-synth`
- Lint: `npm run lint --workspace packages/cdk`
- Test: `npm test --workspace packages/cdk`

## Maintenance

- Update dependencies regularly
- Remove deprecated constructs and suppressions
- Document changes in `nagSuppressions.ts` with reasons

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [CDK Best Practices](https://github.com/aws-samples/aws-cdk-best-practices)
