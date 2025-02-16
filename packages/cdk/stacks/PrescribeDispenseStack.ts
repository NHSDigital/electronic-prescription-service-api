import {
  App,
  Duration,
  Environment,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {HostedZone} from "aws-cdk-lib/aws-route53"
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager"
import {Key} from "aws-cdk-lib/aws-kms"
import {Stream} from "aws-cdk-lib/aws-kinesis"
import {Role} from "aws-cdk-lib/aws-iam"
import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2"
import {Cluster} from "aws-cdk-lib/aws-ecs"
import {Bucket} from "aws-cdk-lib/aws-s3"
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  IpAddressType,
  MutualAuthenticationMode,
  SslPolicy,
  TrustStore
} from "aws-cdk-lib/aws-elasticloadbalancingv2"
import {Repository} from "aws-cdk-lib/aws-ecr"
import {Secret} from "aws-cdk-lib/aws-secretsmanager"
import {ApplicationLoadBalancedFargateService} from "aws-cdk-lib/aws-ecs-patterns"
import {nagSuppressions} from "../nagSuppressions"
import {LogGroups} from "../resources/LogGroups"
import {ECSTasks} from "../resources/ECSTasks"
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
      this, "splunkSubscriptionFilterRole", splunkSubscriptionFilterRoleImport)
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

    // resources
    const logGroups = new LogGroups(this, "logGroups", {
      stackName: props.stackName,
      cloudWatchLogsKmsKey: cloudWatchLogsKmsKey,
      logRetentionInDays: logRetentionInDays,
      splunkDeliveryStream: splunkDeliveryStream,
      splunkSubscriptionFilterRole: splunkSubscriptionFilterRole
    })

    const loadBalancerSecurityGroup = new SecurityGroup(this, "LoadBalancerSecurityGroup", {
      vpc: defaultVpc,
      description: "Allow inbound HTTPS traffic",
      allowAllOutbound: false,
      securityGroupName: `${props.stackName!}-lb-sg`
    })

    loadBalancerSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "ipv4 https frm anywhere")
    loadBalancerSecurityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(443), "ipv6 https frm anywhere")

    const fhirFacadeAlb = new ApplicationLoadBalancer(this, "fhirFacadeAlb", {
      vpc: defaultVpc,
      internetFacing: false,
      securityGroup: loadBalancerSecurityGroup,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      idleTimeout: Duration.seconds(60)
    })
    fhirFacadeAlb.logAccessLogs(albLoggingBucket, `${props.stackName}/access`)
    fhirFacadeAlb.logConnectionLogs(albLoggingBucket, `${props.stackName}/connection`)

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
      validatorLogGroup: logGroups.validatorLogGroup
    })

    const ecsCluster = new Cluster(this, "EcsCluster", {
      clusterName: `${props.stackName!}-cluster`,
      vpc: defaultVpc
    })

    const fhirFacadeAlbCertificate = new Certificate(this, "fhirFacadeAlbCertificate", {
      domainName: `${props.stackName}.${epsDomainNameImport}`,
      validation: CertificateValidation.fromDns(hostedZone)
    })

    const fhirFacadeService = new ApplicationLoadBalancedFargateService(this, "fhirFacadeService", {
      assignPublicIp: false,
      certificate: fhirFacadeAlbCertificate,
      cluster: ecsCluster,
      cpu: 2048,
      desiredCount: 2,
      domainName: `${props.stackName}.${epsDomainNameImport}`,
      domainZone: hostedZone,
      enableECSManagedTags: true,
      ipAddressType: IpAddressType.DUAL_STACK,
      listenerPort: 443,
      loadBalancer: fhirFacadeAlb,
      taskSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS
      },
      memoryLimitMiB: 4096,
      taskDefinition: ecsTasks.fhirFacadeTaskDefinition,
      minHealthyPercent: 100,
      healthCheck: {
        command: [ "CMD-SHELL", "curl -f http://localhost/ || exit 1" ],
        interval: Duration.seconds(10),
        startPeriod: Duration.minutes(5),
        timeout: Duration.seconds(5),
        retries: 2
      }
    })

    const fhirFacadeAlbTrustStore = new TrustStore(this, "fhirFacadeAlbTrustStore", {
      bucket: trustStoreBucket,
      key: trustStoreFile,
      trustStoreName: `${props.stackName!}-ts`,
      version: trustStoreVersion
    })

    const fhirFacadeListener = fhirFacadeAlb.addListener("fhirFacadeListener", {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      certificates: [
        fhirFacadeAlbCertificate
      ],
      ...(enableMutualTls) && {mutualAuthentication: {
        ignoreClientCertificateExpiry: false,
        mutualAuthenticationMode: MutualAuthenticationMode.VERIFY,
        trustStore: fhirFacadeAlbTrustStore
      }},
      sslPolicy: SslPolicy.TLS13_EXT2
    })
    fhirFacadeListener.addTargetGroups("targetGroups", {
      targetGroups: [fhirFacadeService.targetGroup]
    })

    nagSuppressions(this)
  }
}
