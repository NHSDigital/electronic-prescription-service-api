import {Construct} from "constructs"
import {Duration, RemovalPolicy} from "aws-cdk-lib"
import {
  Bucket,
  BucketEncryption,
  BlockPublicAccess,
  ObjectOwnership,
  CfnBucket,
  CfnBucketPolicy,
  LifecycleRule
} from "aws-cdk-lib/aws-s3"
import {CfnKey, Key} from "aws-cdk-lib/aws-kms"
import {
  AccountRootPrincipal,
  Effect,
  IPrincipal,
  PolicyDocument,
  PolicyStatement
} from "aws-cdk-lib/aws-iam"

export interface S3BucketProps {
  readonly bucketName: string
  readonly deploymentRole: IPrincipal
  readonly itemExpiryDays?: number
}

export class S3Bucket extends Construct {
  public readonly bucket: Bucket
  public readonly kmsKey: Key

  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id)

    const kmsKey = new Key(this, "BucketKey", {
      enableKeyRotation: true,
      description: `KMS key for ${props.bucketName} S3 bucket encryption`,
      removalPolicy: RemovalPolicy.DESTROY
    })
    kmsKey.addAlias(`alias/${props.bucketName}-s3-key`)

    const expiryLifecycleRule: LifecycleRule | undefined = props.itemExpiryDays ? {
      id: "ItemExpiry",
      enabled: true,
      expiration: Duration.days(props.itemExpiryDays)
    } : undefined

    const bucket = new Bucket(this, props.bucketName, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.KMS,
      encryptionKey: kmsKey,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      versioned: false,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      lifecycleRules: props.itemExpiryDays ? [expiryLifecycleRule!] : []
    })

    // Adding full deployment roles to this bucket
    const deploymentPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      principals: [props.deploymentRole],
      actions: [
        "s3:Abort*",
        "s3:DeleteObject",
        "s3:GetBucket*",
        "s3:GetObject*",
        "s3:List*",
        "s3:PutObject",
        "s3:PutObjectLegalHold",
        "s3:PutObjectRetention",
        "s3:PutObjectTagging",
        "s3:PutObjectVersionTagging",
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      resources: [
        bucket.bucketArn,
        bucket.arnForObjects("*")
      ]
    })

    const accountRootPrincipal = new AccountRootPrincipal()
    const kmsPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [accountRootPrincipal],
          actions: ["kms:*"],
          resources: ["*"]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          principals: [props.deploymentRole],
          actions: [
            "kms:Encrypt",
            "kms:GenerateDataKey"
          ],
          resources:["*"]
        })
      ]
    })

    bucket.addToResourcePolicy(deploymentPolicy)

    const cfnKey = (kmsKey.node.defaultChild as CfnKey)
    cfnKey.keyPolicy = kmsPolicy.toJSON()

    const cfnBucket = bucket.node.defaultChild as CfnBucket
    cfnBucket.cfnOptions.metadata = {
      ...cfnBucket.cfnOptions.metadata,
      guard: {
        SuppressedRules: [
          "S3_BUCKET_REPLICATION_ENABLED",
          "S3_BUCKET_VERSIONING_ENABLED",
          "S3_BUCKET_DEFAULT_LOCK_ENABLED",
          "S3_BUCKET_LOGGING_ENABLED"
        ]
      }
    }

    const policy = bucket.policy!
    const cfnBucketPolicy = policy.node.defaultChild as CfnBucketPolicy
    cfnBucketPolicy.cfnOptions.metadata = (
      {
        ...cfnBucketPolicy.cfnOptions.metadata,
        guard: {
          SuppressedRules: [
            "S3_BUCKET_SSL_REQUESTS_ONLY"
          ]
        }
      }
    )

    this.kmsKey = kmsKey
    this.bucket = bucket
  }
}
