import {Construct} from "constructs"
import {S3Bucket} from "../constructs/S3Bucket"
import {
  IPrincipal,
  IRole,
  ManagedPolicy,
  PolicyStatement
} from "aws-cdk-lib/aws-iam"
import {Key} from "aws-cdk-lib/aws-kms"
import {Bucket, IBucket} from "aws-cdk-lib/aws-s3"
import {ContainerDefinition} from "aws-cdk-lib/aws-ecs"

export interface ObservabilityProps {
  readonly stackName: string,
  readonly deploymentRole: IPrincipal,
  readonly auditLoggingBucket: IBucket,
  readonly ecsTaskExecutionRole: IRole
  readonly coordinatorContainer: ContainerDefinition
}

export class Observability extends Construct {
  public readonly observabilityBucket: Bucket
  public readonly observabilityKmsKey: Key

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
    props.ecsTaskExecutionRole.addManagedPolicy(observabilityBucketWritePolicy)

    props.coordinatorContainer.addEnvironment("OBSERVABILITY_BUCKET_ARN", observabilityBucket.bucket.bucketArn)
  }
}
