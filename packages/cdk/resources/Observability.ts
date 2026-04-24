import {Construct} from "constructs"
import {S3Bucket} from "../constructs/S3Bucket"
import {IPrincipal, ManagedPolicy, PolicyStatement} from "aws-cdk-lib/aws-iam"
import {IBucket} from "aws-cdk-lib/aws-s3"

export interface ObservabilityProps {
  readonly stackName: string,
  readonly deploymentRole: IPrincipal,
  readonly auditLoggingBucket: IBucket,
}

export class Observability extends Construct {
  public readonly observabilityBucketArn: string
  public readonly observabilityBucketWritePolicy: ManagedPolicy
  public readonly observabilityRoutes: string

  constructor(scope: Construct, id: string, props: ObservabilityProps) {
    super(scope, id)

    // Create S3 bucket for fhir facade request/response data with encryption
    const observabilityBucket = new S3Bucket(this, "Observability", {
      bucketName: `${props.stackName}-observability`,
      deploymentRole: props.deploymentRole,
      auditLoggingBucket: props.auditLoggingBucket,
      itemExpiryDays: 42
    })

    const observabilityBucketWritePolicy = new ManagedPolicy(this, "observabilityBucketWritePolicy", {
      statements: [
        new PolicyStatement({
          actions: [
            "s3:GetBucket",
            "s3:PutObject"
          ],
          resources: [
            observabilityBucket.bucket.bucketArn
          ]
        }),
        new PolicyStatement({
          actions: [
            "kms:DescribeKey",
            "kms:Encrypt"
          ],
          resources: [
            observabilityBucket.kmsKey.keyArn
          ]
        })
      ]
    })

    // Outputs
    this.observabilityBucketArn = observabilityBucket.bucket.bucketArn
    this.observabilityBucketWritePolicy = observabilityBucketWritePolicy
    this.observabilityRoutes = "claim,release,task,process-message"
  }
}
