---
description: 'Guidelines for writing, reviewing, and maintaining SAM templates'
applyTo: 'SAMtemplates/**'
---

This file is mastered in https://github.com/NHSDigital/eps-copilot-instructions and is automatically synced to all EPS repositories. To suggest changes, please open an issue or pull request in the eps-copilot-instructions repository.

## Scope
These instructions apply exclusively to files located under the `SAMtemplates` directory. Ensure that any SAM templates or related configurations outside this directory are not governed by these guidelines.

## Project Context
This is a healthcare API service deployed using AWS SAM (Serverless Application Model) with a modular template structure. The service includes Lambda functions, API Gateway, Step Functions state machines, and associated AWS resources.

## Template Structure and Conventions

### File Organization
- `main_template.yaml` - Root template that orchestrates all components
- `functions/main.yaml` - Lambda functions and layers
- `apis/main.yaml` - API Gateway and domain configuration
- `state_machines/main.yaml` - Step Functions state machines
- `parameters/main.yaml` - SSM parameters and policies
- `*_resources.yaml` - Reusable resource templates for IAM roles, policies, and logging

### Naming Conventions
- Stack resources: Use `!Sub ${StackName}-<ResourceName>` pattern
- Functions: `${StackName}-<FunctionName>` (e.g., `${StackName}-GetMyPrescriptions`)
- Parameters: Environment-specific with validation (dev, dev-pr, qa, int, prod, ref)
- IAM roles: Follow AWS service naming conventions with descriptive suffixes

### Standard Parameters
Always include these common parameters in templates:
```yaml
Parameters:
  StackName:
    Type: String
    Default: none
  Env:
    Type: String
    Default: dev
    AllowedValues: [dev, dev-pr, qa, int, prod, ref]
  
  LogRetentionInDays:
    Type: Number
    Default: 30
    AllowedValues: [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
  
  EnableSplunk:
    Type: String
    Default: false
    AllowedValues: [true, false]
```

### Lambda Function 

The runtime should match the nodejs version in .tool-versions file
The LambdaInsightsExtension version should match the latest available version available in eu-west-2 region

#### Global Configuration
```yaml
Globals:
  Function:
    Timeout: 50
    MemorySize: 256
    Architectures: [x86_64]
    Runtime: nodejs22.x
    Environment:
      Variables:
        STACK_NAME: !Ref StackName
        NODE_OPTIONS: "--enable-source-maps"
    Layers:
      - !Sub arn:aws:lambda:${AWS::Region}:580247275435:layer:LambdaInsightsExtension:52
```

#### Lambda Function Template
```yaml
<FunctionName>:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: !Sub ${StackName}-<FunctionName>
    CodeUri: ../../packages
    Handler: <handlerFile>.handler
    Role: !GetAtt <FunctionName>Resources.Outputs.LambdaRoleArn
    Environment:
      Variables:
        LOG_LEVEL: !Ref LogLevel
        DEPLOYMENT_ENVIRONMENT: !Ref Env
  Metadata:
    BuildMethod: esbuild
    guard:
      SuppressedRules:
        - LAMBDA_DLQ_CHECK
        - LAMBDA_INSIDE_VPC
```

### API Gateway Patterns

#### REST API Configuration
```yaml
RestApiGateway:
  Type: AWS::ApiGateway::RestApi
  Properties:
    Name: !Sub ${StackName}-apigw
    DisableExecuteApiEndpoint: !If [ShouldUseMutualTLS, true, !Ref AWS::NoValue]
    EndpointConfiguration:
      Types: [REGIONAL]

RestApiDomain:
  Type: AWS::ApiGateway::DomainName
  Properties:
    DomainName: !Join ['.', [!Ref StackName, !ImportValue eps-route53-resources:EPS-domain]]
    RegionalCertificateArn: !Ref GenerateCertificate
    EndpointConfiguration:
      Types: [REGIONAL]
    SecurityPolicy: TLS_1_2
```

### State Machine Patterns
```yaml
<StateMachineName>:
  Type: AWS::Serverless::StateMachine
  Properties:
    Name: !Sub ${StackName}-<StateMachineName>
    Type: EXPRESS
    Role: !GetAtt <StateMachineName>Resources.Outputs.StateMachineRoleArn
    DefinitionUri: <StateMachineName>.asl.json
    DefinitionSubstitutions:
      <FunctionName>Arn: !Sub ${<FunctionName>Arn}:$LATEST
```

### Security and Compliance

#### Mutual TLS Support
Use conditions for optional mTLS:
```yaml
Conditions:
  ShouldUseMutualTLS: !Equals [true, !Ref EnableMutualTLS]

# In resource properties:
MutualTlsAuthentication:
  TruststoreUri: !If [ShouldUseMutualTLS, !Sub 's3://${TruststoreFile}', !Ref AWS::NoValue]
```

#### IAM Policies
- Use managed policies from separate resource templates
- Import cross-stack values: `!ImportValue account-resources:SpinePrivateKey`
- Follow principle of least privilege
- Include guard rules suppression only where necessary. By default these should not be added. If they are added an explanation should be included to say why we are overriding them

### Environment Variables and Secrets
```yaml
Environment:
  Variables:
    STACK_NAME: !Ref StackName
    DEPLOYMENT_ENVIRONMENT: !Ref Env
    # Spine integration
    TargetSpineServer: !Ref TargetSpineServer
    SpinePrivateKeyARN: !ImportValue account-resources:SpinePrivateKey
    SpinePublicCertificateARN: !ImportValue account-resources:SpinePublicCertificate
    # Service search
    TargetServiceSearchServer: !Ref TargetServiceSearchServer
    ServiceSearchApiKeyARN: !ImportValue account-resources:ServiceSearchApiKey
```

### Logging Configuration
```yaml
# CloudWatch Log Groups
<ServiceName>LogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: !Sub /aws/lambda/${StackName}-<ServiceName>
    RetentionInDays: !Ref LogRetentionInDays
    KmsKeyId: !If [ShouldUseKMS, !Ref CloudWatchKMSKeyId, !Ref AWS::NoValue]

# Splunk integration (conditional)
<ServiceName>SubscriptionFilter:
  Type: AWS::Logs::SubscriptionFilter
  Properties:
    LogGroupName: !Ref <ServiceName>LogGroup
    FilterPattern: ""
    DestinationArn: !Ref SplunkDeliveryStreamArn
    RoleArn: !Ref SplunkSubscriptionFilterRole
```

### Best Practices

1. **Modular Design**: Split templates by service domain (functions, apis, state_machines)
2. **Parameter Validation**: Use AllowedValues for environment-specific parameters
3. **Cross-Stack References**: Use ImportValue for shared resources
4. **Conditional Resources**: Use conditions for environment-specific resources
5. **Resource Naming**: Consistent naming with stack prefix
6. **Documentation**: Include meaningful descriptions for all resources
7. **Guard Rules**: Suppress only when necessary and document reasons
8. **Build Methods**: Use esbuild for Node.js Lambda functions
9. **Version Pinning**: Pin Lambda layer versions and runtimes

### Common Import Values
- `eps-route53-resources:EPS-domain`
- `eps-route53-resources:EPS-ZoneID`


When generating CloudFormation/SAM templates, follow these patterns and ensure compliance with NHS Digital standards and AWS security best practices.
