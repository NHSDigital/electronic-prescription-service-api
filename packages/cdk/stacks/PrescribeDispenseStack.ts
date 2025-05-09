import {
  App,
  Duration,
  Environment,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {HostedZone} from "aws-cdk-lib/aws-route53"
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager"
import {Key} from "aws-cdk-lib/aws-kms"
import {Stream} from "aws-cdk-lib/aws-kinesis"
import {Role} from "aws-cdk-lib/aws-iam"
import {Port, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2"
import {Cluster, ContainerInsights} from "aws-cdk-lib/aws-ecs"
import {Bucket} from "aws-cdk-lib/aws-s3"
import {
  ApplicationProtocol,
  CfnListener,
  IpAddressType,
  ListenerCondition,
  TrustStore
} from "aws-cdk-lib/aws-elasticloadbalancingv2"
import {Repository} from "aws-cdk-lib/aws-ecr"
import {Secret} from "aws-cdk-lib/aws-secretsmanager"
import {ApplicationLoadBalancedFargateService} from "aws-cdk-lib/aws-ecs-patterns"
import {nagSuppressions} from "../nagSuppressions"
import {LogGroups} from "../resources/LogGroups"
import {ECSTasks} from "../resources/ECSTasks"
import {
  ScalableTarget,
  PredefinedMetric,
  ServiceNamespace,
  TargetTrackingScalingPolicy,
  Schedule
} from "aws-cdk-lib/aws-applicationautoscaling"
import {LogGroup} from "aws-cdk-lib/aws-logs"

export interface PrescribeDispenseStackProps extends StackProps {
    readonly env: Environment
    readonly serviceName: string
    readonly stackName: string
    readonly version: string
  }

export class PrescribeDispenseStack extends Stack {

  public constructor(scope: App, id: string, props: PrescribeDispenseStackProps) {
    super(scope, id, props)

    // contexts
    const logRetentionInDays: number = Number(this.node.tryGetContext("logRetentionInDays"))
    const vpcId: string = this.node.tryGetContext("vpcId")
    const trustStoreBucketArn: string = this.node.tryGetContext("trustStoreBucketArn")
    const trustStoreFile: string = this.node.tryGetContext("trustStoreFile")
    const commitId: string = this.node.tryGetContext("commitId")
    const dockerImageTag: string = this.node.tryGetContext("dockerImageTag")
    const targetSpineServer: string = this.node.tryGetContext("targetSpineServer")
    const logLevel: string = this.node.tryGetContext("logLevel")
    const toAsid: string = this.node.tryGetContext("toAsid")
    const toPartyKey: string = this.node.tryGetContext("toPartyKey")
    const containerPort: number = 9000
    const containerPortValidator: number = 9001
    const validatorLogLevel: string = this.node.tryGetContext("validatorLogLevel")
    const enableDefaultAsidPartyKey: string = this.node.tryGetContext("enableDefaultAsidPartyKey")
    const defaultPTLAsid: string = this.node.tryGetContext("defaultPTLAsid")
    const defaultPTLPartyKey: string = this.node.tryGetContext("defaultPTLPartyKey")
    const enableMutualTls: boolean = this.node.tryGetContext("enableMutualTls")
    const trustStoreVersion: string = this.node.tryGetContext("trustStoreVersion")
    const SHA1EnabledApplicationIds: string = this.node.tryGetContext("SHA1EnabledApplicationIds")
    const sandboxModeEnabled: string = this.node.tryGetContext("sandboxModeEnabled")
    const desiredFhirFacadeCount: number = this.node.tryGetContext("desiredFhirFacadeCount")
    const desiredClaimsCount: number = this.node.tryGetContext("desiredClaimsCount")
    const desiredPeakClaimsCount: number = this.node.tryGetContext("desiredPeakClaimsCount")
    const desiredOffPeakClaimsCount: number = this.node.tryGetContext("desiredOffPeakClaimsCount")
    const serviceCpu: number = this.node.tryGetContext("serviceCpu")
    const serviceMemory: number = this.node.tryGetContext("serviceMemory")
    const ApigeeEnvironment: string = this.node.tryGetContext("ApigeeEnvironment")

    // imports
    const cloudWatchLogKmsKeyArnImport = Fn.importValue("account-resources:CloudwatchLogsKmsKeyArn")
    const splunkDeliveryStreamImport = Fn.importValue("lambda-resources:SplunkDeliveryStream")
    const splunkSubscriptionFilterRoleImport = Fn.importValue("lambda-resources:SplunkSubscriptionFilterRole")
    const epsHostedZoneIdImport: string = Fn.importValue("eps-route53-resources:EPS-ZoneID")
    const epsDomainNameImport: string = Fn.importValue("eps-route53-resources:EPS-domain")
    const albLoggingBucketNameImport = Fn.importValue("account-resources:ALBLoggingBucketName")
    const spinePrivateKeyImport = Fn.importValue("account-resources:SpinePrivateKey")
    const spinePublicCertificateImport = Fn.importValue("account-resources:SpinePublicCertificate")
    const spineCAChainImport = Fn.importValue("account-resources:SpineCAChain")
    const epsSigningCertChainImport = Fn.importValue("secrets:epsSigningCertChain")

    // cooerce context and imports to relevant types
    const hostedZone = HostedZone.fromHostedZoneAttributes(this, "hostedZone", {
      hostedZoneId: epsHostedZoneIdImport,
      zoneName: epsDomainNameImport
    })
    const cloudWatchLogsKmsKey = Key.fromKeyArn(
      this, "cloudWatchLogsKmsKey", cloudWatchLogKmsKeyArnImport
    )
    const defaultVpc = Vpc.fromLookup(
      this, "defaultVpc", {
        vpcId: vpcId
      })
    const splunkDeliveryStream = Stream.fromStreamArn(
      this, "SplunkDeliveryStream", splunkDeliveryStreamImport)

    const splunkSubscriptionFilterRole = Role.fromRoleArn(
      this, "SplunkSubscriptionFilterRole", splunkSubscriptionFilterRoleImport)
    const trustStoreBucket = Bucket.fromBucketArn(this, "trustStoreBucket", trustStoreBucketArn)
    const albLoggingBucket = Bucket.fromBucketName(this, "albLoggingBucket", albLoggingBucketNameImport)

    const fhirFacadeRepo = Repository.fromRepositoryName(this, "fhirFacadeRepo",
      "fhir-facade-repo"
    )
    const validatorRepo = Repository.fromRepositoryName(this, "validatorRepo",
      "validator-repo"
    )

    const spinePrivateKey = Secret.fromSecretCompleteArn(this, "spinePrivateKey", spinePrivateKeyImport)
    const spinePublicCertificate = Secret.fromSecretCompleteArn(
      this,
      "spinePublicCertificate",
      spinePublicCertificateImport
    )
    const spineCAChain = Secret.fromSecretCompleteArn(this, "spineCAChain", spineCAChainImport)
    const epsSigningCertChain = Secret.fromSecretCompleteArn(this, "epsSigningCertChain", epsSigningCertChainImport)

    const fhirFacadeHostname = `${props.stackName}.${epsDomainNameImport}`

    // resources
    const logGroups = new LogGroups(this, "logGroups", {
      stackName: props.stackName,
      cloudWatchLogsKmsKey: cloudWatchLogsKmsKey,
      logRetentionInDays: logRetentionInDays,
      splunkDeliveryStream: splunkDeliveryStream,
      splunkSubscriptionFilterRole: splunkSubscriptionFilterRole
    })

    const ecsTasks = new ECSTasks(this, "ecsTasks", {
      stackName: props.stackName,
      fhirFacadeRepo: fhirFacadeRepo,
      validatorRepo: validatorRepo,
      dockerImageTag: dockerImageTag,
      containerPort: containerPort,
      containerPortValidator: containerPortValidator,
      targetSpineServer: targetSpineServer,
      commitId: commitId,
      version: props.version,
      logLevel: logLevel,
      validatorLogLevel: validatorLogLevel,
      toAsid: toAsid,
      toPartyKey: toPartyKey,
      enableDefaultAsidPartyKey: enableDefaultAsidPartyKey,
      defaultPTLAsid: defaultPTLAsid,
      defaultPTLPartyKey: defaultPTLPartyKey,
      spinePrivateKey: spinePrivateKey,
      spinePublicCertificate: spinePublicCertificate,
      spineCAChain: spineCAChain,
      epsSigningCertChain: epsSigningCertChain,
      coordinatorLogGroup: logGroups.coordinatorLogGroup,
      validatorLogGroup: logGroups.validatorLogGroup,
      SHA1EnabledApplicationIds: SHA1EnabledApplicationIds,
      sandboxModeEnabled: sandboxModeEnabled,
      cpu: serviceCpu,
      memory: serviceMemory,
      taskExecutionRoleName: `${props.stackName}-fhirFacadeTaskExecutionRole`,
      ApigeeEnvironment: ApigeeEnvironment,
      containerNamePrefix: "fhirFacade",
      pollingDelay: 5000
    })

    const claimsEcsTasks = new ECSTasks(this, "claimsEcsTasks", {
      stackName: props.stackName,
      fhirFacadeRepo: fhirFacadeRepo,
      validatorRepo: validatorRepo,
      dockerImageTag: dockerImageTag,
      containerPort: containerPort,
      containerPortValidator: containerPortValidator,
      targetSpineServer: targetSpineServer,
      commitId: commitId,
      version: props.version,
      logLevel: logLevel,
      validatorLogLevel: validatorLogLevel,
      toAsid: toAsid,
      toPartyKey: toPartyKey,
      enableDefaultAsidPartyKey: enableDefaultAsidPartyKey,
      defaultPTLAsid: defaultPTLAsid,
      defaultPTLPartyKey: defaultPTLPartyKey,
      spinePrivateKey: spinePrivateKey,
      spinePublicCertificate: spinePublicCertificate,
      spineCAChain: spineCAChain,
      epsSigningCertChain: epsSigningCertChain,
      coordinatorLogGroup: logGroups.claimsCoordinatorLogGroup,
      validatorLogGroup: logGroups.claimsValidatorLogGroup,
      SHA1EnabledApplicationIds: SHA1EnabledApplicationIds,
      sandboxModeEnabled: sandboxModeEnabled,
      cpu: serviceCpu,
      memory: serviceMemory,
      taskExecutionRoleName: `${props.stackName}-claimsTaskExecutionRole`,
      ApigeeEnvironment: ApigeeEnvironment,
      containerNamePrefix: "claims",
      pollingDelay: 13000
    })

    // log group for insights
    const insightLogGroups = new LogGroup(this, "insightsLogGroup", {
      encryptionKey: cloudWatchLogsKmsKey,
      logGroupName: `/aws/ecs/containerinsights/${props.stackName}-cluster/performance`,
      retention: logRetentionInDays,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const ecsCluster = new Cluster(this, "EcsCluster", {
      clusterName: `${props.stackName}-cluster`,
      vpc: defaultVpc,
      containerInsightsV2: ContainerInsights.ENHANCED
    })

    // add dependency on insight log groups for the cluster as we want our own insight log group not an auto created one
    ecsCluster.node.addDependency(insightLogGroups)

    const fhirFacadeAlbCertificate = new Certificate(this, "fhirFacadeAlbCertificate", {
      domainName: fhirFacadeHostname,
      validation: CertificateValidation.fromDns(hostedZone)
    })

    const fhirFacadeService = new ApplicationLoadBalancedFargateService(this, "fhirFacadeService", {
      assignPublicIp: false,
      certificate: fhirFacadeAlbCertificate,
      cluster: ecsCluster,
      desiredCount: desiredFhirFacadeCount,
      domainName: fhirFacadeHostname,
      domainZone: hostedZone,
      enableECSManagedTags: true,
      ipAddressType: IpAddressType.IPV4,
      listenerPort: 443,
      taskSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      },
      taskDefinition: ecsTasks.fhirFacadeTaskDefinition,
      minHealthyPercent: 100,
      healthCheckGracePeriod: Duration.seconds(300)
    })

    fhirFacadeService.loadBalancer.logAccessLogs(albLoggingBucket, `${props.stackName}/access`)
    fhirFacadeService.loadBalancer.logConnectionLogs(albLoggingBucket, `${props.stackName}/connection`)
    fhirFacadeService.loadBalancer.setAttribute("routing.http.drop_invalid_header_fields.enabled", "true")

    fhirFacadeService.targetGroup.configureHealthCheck({
      path: "/_healthcheck",
      interval: Duration.seconds(10),
      timeout: Duration.seconds(5),
      unhealthyThresholdCount: 2,
      healthyThresholdCount: 2
    })

    // create scaling policy
    const fhirFacadeServiceScalableTarget = new ScalableTarget(this, "fhirFacadeServiceScalableTarget", {
      serviceNamespace: ServiceNamespace.ECS,
      resourceId: `service/${fhirFacadeService.cluster.clusterName}/${fhirFacadeService.service.serviceName}`,
      scalableDimension: "ecs:service:DesiredCount",
      minCapacity: desiredFhirFacadeCount,
      maxCapacity: 10
    })

    // // scale up if average cpu goes above 70%
    new TargetTrackingScalingPolicy(this, "fhirFacadeScalingPolicy", {
      scalingTarget: fhirFacadeServiceScalableTarget,
      targetValue: 70,
      disableScaleIn: false,
      scaleOutCooldown: Duration.seconds(60),
      scaleInCooldown: Duration.seconds(60),
      predefinedMetric: PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION
    })

    if (enableMutualTls) {
      const fhirFacadeAlbTrustStore = new TrustStore(this, "fhirFacadeAlbTrustStore", {
        bucket: trustStoreBucket,
        key: trustStoreFile,
        version: trustStoreVersion
      })

      const CFNfhirFacadeListener = fhirFacadeService.listener.node.defaultChild as CfnListener
      CFNfhirFacadeListener.addPropertyOverride("MutualAuthentication.IgnoreClientCertificateExpiry", "False")
      CFNfhirFacadeListener.addPropertyOverride("MutualAuthentication.Mode", "verify")
      CFNfhirFacadeListener.addPropertyOverride(
        "MutualAuthentication.TrustStoreArn", fhirFacadeAlbTrustStore.trustStoreArn
      )

      // add dependency on truststore to fhir facade service so they get deleted in the correct order
      fhirFacadeService.node.addDependency(fhirFacadeAlbTrustStore)
    }

    // create the claims service
    // note - this has publicLoadBalancer set to false
    const claimsService = new ApplicationLoadBalancedFargateService(this, "claimsService", {
      assignPublicIp: false,
      cluster: ecsCluster,
      desiredCount: desiredClaimsCount,
      enableECSManagedTags: true,
      ipAddressType: IpAddressType.IPV4,
      listenerPort: 443,
      taskSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      },
      taskDefinition: claimsEcsTasks.fhirFacadeTaskDefinition,
      minHealthyPercent: 100,
      publicLoadBalancer: false
    })

    claimsService.loadBalancer.logAccessLogs(albLoggingBucket, `${props.stackName}_claims/access`)
    claimsService.loadBalancer.logConnectionLogs(albLoggingBucket, `${props.stackName}_claims/connection`)

    claimsService.targetGroup.configureHealthCheck({
      path: "/_healthcheck",
      interval: Duration.seconds(10),
      timeout: Duration.seconds(5),
      unhealthyThresholdCount: 2,
      healthyThresholdCount: 2
    })

    const claimsServiceScalableTarget = new ScalableTarget(this, "claimsServiceScalableTarget", {
      serviceNamespace: ServiceNamespace.ECS,
      resourceId: `service/${claimsService.cluster.clusterName}/${claimsService.service.serviceName}`,
      scalableDimension: "ecs:service:DesiredCount",
      minCapacity: desiredClaimsCount,
      maxCapacity: 10
    })

    // scale up if average cpu goes above 70%
    new TargetTrackingScalingPolicy(this, "claimsScalingPolicy", {
      scalingTarget: claimsServiceScalableTarget,
      targetValue: 70,
      disableScaleIn: false,
      scaleOutCooldown: Duration.seconds(60),
      scaleInCooldown: Duration.seconds(60),
      predefinedMetric: PredefinedMetric.ECS_SERVICE_AVERAGE_CPU_UTILIZATION
    })

    const monthEndDaysScaleOut = "20,21,22,23,24,25,26,27,28,29,30,31,1,2,3,4,5"
    const monthEndDaysScaleIn = "21,22,23,24,25,26,27,28,29,30,31,1,2,3,4,5,6"
    claimsServiceScalableTarget.scaleOnSchedule("claimsScaleOut", {
      schedule: Schedule.cron({day: monthEndDaysScaleOut, hour: "7", minute: "00"}),
      minCapacity: desiredPeakClaimsCount,
      maxCapacity: 10
    })

    claimsServiceScalableTarget.scaleOnSchedule("claimsScaleIn", {
      schedule: Schedule.cron({day: monthEndDaysScaleIn, hour: "01", minute: "0"}),
      minCapacity: desiredOffPeakClaimsCount,
      maxCapacity: 10
    })

    // add a route from main listener to claims service
    const listener = fhirFacadeService.listener
    listener.addTargets("ClaimsTarget", {
      priority: 10, // Priority must be unique
      conditions: [ListenerCondition.pathPatterns(["/FHIR/R4/Claim*"])],
      targets: [claimsService.service],
      port: claimsService.listener.port,
      protocol: ApplicationProtocol.HTTP,
      healthCheck: {
        path: "/_healthcheck",
        interval: Duration.seconds(10),
        timeout: Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2
      }
    })

    const fhirFacadeLoadBalancerSG = fhirFacadeService.loadBalancer.connections.securityGroups[0]
    const claimsSG = claimsService.service.connections.securityGroups[0]
    claimsSG.addIngressRule(
      fhirFacadeLoadBalancerSG,
      Port.tcp(containerPort),
      "Allow traffic from FHIR Facade load balancer to Claims Service"
    )
    fhirFacadeLoadBalancerSG.addEgressRule(
      claimsSG,
      Port.tcp(containerPort),
      "Allow traffic to Claims Service from FHIR Facade load balancer"
    )
    nagSuppressions(this)
  }
}
