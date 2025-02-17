import {Construct} from "constructs"

import {ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam"
import {ILogGroup} from "aws-cdk-lib/aws-logs"
import {IRepository} from "aws-cdk-lib/aws-ecr"
import {
  ContainerImage,
  CpuArchitecture,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
  Protocol,
  Secret as ecsSecret
} from "aws-cdk-lib/aws-ecs"
import {ISecret} from "aws-cdk-lib/aws-secretsmanager"
import {Fn} from "aws-cdk-lib"

export interface ECSTasksProps {
  readonly stackName: string
  readonly fhirFacadeRepo: IRepository
  readonly validatorRepo: IRepository
  readonly dockerImageTag: string
  readonly containerPort: number
  readonly containerPortValidator: number
  readonly targetSpineServer: string
  readonly commitId: string
  readonly version: string
  readonly logLevel: string
  readonly validatorLogLevel: string
  readonly toAsid: string
  readonly toPartyKey: string
  readonly enableDefaultAsidPartyKey: string
  readonly defaultPTLAsid: string
  readonly defaultPTLPartyKey: string
  readonly spinePrivateKey: ISecret
  readonly spinePublicCertificate: ISecret
  readonly spineCAChain: ISecret
  readonly epsSigningCertChain: ISecret
  readonly coordinatorLogGroup: ILogGroup
  readonly validatorLogGroup: ILogGroup
  readonly SHA1EnabledApplicationIds: string
}

/**
 * Log groups
 */

export class ECSTasks extends Construct {
  public readonly fhirFacadeTaskDefinition: FargateTaskDefinition

  public constructor(scope: Construct, id: string, props: ECSTasksProps) {
    super(scope, id)

    // Resources

    const ecsTaskExecutionRolePolicy = ManagedPolicy.fromManagedPolicyArn(
      this,
      "AmazonECSTaskExecutionRolePolicy",
      "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    )
    const lambdaAccessSecretsPolicy = ManagedPolicy.fromManagedPolicyArn(
      this,
      "LambdaAccessSecretsPolicy",
      Fn.importValue("account-resources:LambdaAccessSecretsPolicy")
    )
    const lambdaDecryptSecretsKMSPolicy = ManagedPolicy.fromManagedPolicyArn(
      this,
      "LambdaDecryptSecretsKMSPolicy",
      Fn.importValue("account-resources:LambdaDecryptSecretsKMSPolicy")
    )
    const epsSigningCertChainManagedPolicy = ManagedPolicy.fromManagedPolicyArn(
      this,
      "EpsSigningCertChainManagedPolicy",
      Fn.importValue("secrets:epsSigningCertChainManagedPolicy")
    )

    const ecsTaskExecutionRole = new Role(this, "EcsTaskExecutionRole", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        ecsTaskExecutionRolePolicy,
        lambdaAccessSecretsPolicy,
        lambdaDecryptSecretsKMSPolicy,
        epsSigningCertChainManagedPolicy
      ],
      roleName: `${props.stackName!}-ecsTaskExecutionRole`
    })

    const fhirFacadeTaskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      cpu: 2048,
      memoryLimitMiB: 4096,
      executionRole: ecsTaskExecutionRole,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX
      }
    })

    fhirFacadeTaskDefinition.addContainer("coordinator", {
      image: ContainerImage.fromEcrRepository(
        props.fhirFacadeRepo,
        props.dockerImageTag),
      containerName: `${props.stackName!}-coordinator`,
      disableNetworking: false,
      portMappings: [
        {
          containerPort: props.containerPort,
          protocol: Protocol.TCP
        }
      ],
      environment: {
        VALIDATOR_HOST: `${props.stackName!}-validator`,
        TARGET_SPINE_SERVER:  props.targetSpineServer,
        MTLS_SPINE_CLIENT: "True",
        PRESCRIBE_ENABLED: "true",
        DISPENSE_ENABLED: "true",
        COMMIT_ID: props.commitId,
        CRL_DISTRIBUTION_DOMAIN: "crl.nhs.uk",
        CRL_DISTRIBUTION_PROXY: "crl.nhs.uk",
        DEPLOYED_VERSION: props.version,
        DOSE_TO_TEXT_MODE: "AUDIT",
        ENVIRONMENT: "internal-dev",
        LOG_LEVEL: props.logLevel,
        NODE_ENV: "production",
        SANDBOX: "0",
        TO_ASID: props.toAsid,
        TO_PARTY_KEY: props.toPartyKey,
        USE_SHA256_PREPARE: "false",
        ENABLE_DEFAULT_ASID_PARTY_KEY: props.enableDefaultAsidPartyKey,
        DEFAULT_PTL_ASID: props.defaultPTLAsid,
        DEFAULT_PTL_PARTY_KEY: props.defaultPTLPartyKey,
        SHA1_ENABLED_APPLICATION_IDS: props.SHA1EnabledApplicationIds
      },
      secrets: {
        SpinePrivateKey: ecsSecret.fromSecretsManager(props.spinePrivateKey),
        SpinePublicCertificate: ecsSecret.fromSecretsManager(props.spinePublicCertificate),
        spineCAChain: ecsSecret.fromSecretsManager(props.spineCAChain),
        epsSigningCertChain: ecsSecret.fromSecretsManager(props.epsSigningCertChain)
      },
      logging:  LogDrivers.awsLogs({
        streamPrefix: "ecs",
        logGroup: props.coordinatorLogGroup
      })
    })

    fhirFacadeTaskDefinition.addContainer("validator", {
      image: ContainerImage.fromEcrRepository(
        props.validatorRepo,
        props.dockerImageTag),
      containerName: `${props.stackName!}-validator`,
      disableNetworking: false,
      portMappings: [
        {
          containerPort: props.containerPortValidator,
          protocol: Protocol.TCP
        }
      ],
      environment: {
        LOG_LEVEL: props.validatorLogLevel
      },
      logging:  LogDrivers.awsLogs({
        streamPrefix: "ecs",
        logGroup: props.validatorLogGroup
      })
    })

    // Outputs
    this.fhirFacadeTaskDefinition = fhirFacadeTaskDefinition
  }
}
