import {Construct} from "constructs"
import {S3Bucket} from "../constructs/S3Bucket"
import {IPrincipal} from "aws-cdk-lib/aws-iam"
import {Key} from "aws-cdk-lib/aws-kms"
import {Bucket} from "aws-cdk-lib/aws-s3"

export interface ObservabilityBucketProps {
  readonly stackName: string,
  readonly deploymentRole: IPrincipal
}

export class ObservabilityBucket extends Construct {
  public readonly observabilityBucket: Bucket
  public readonly observabilityKmsKey: Key

  constructor(scope: Construct, id: string, props: ObservabilityBucketProps) {
    super(scope, id)

    // Create S3 bucket for fhir facade request/response data with encryption
    const observabilityBucket = new S3Bucket(this, "ObservabilityBucket", {
      bucketName: `${props.stackName}-observability`,
      deploymentRole: props.deploymentRole,
      itemExpiryDays: 42
    })
    this.observabilityBucket = observabilityBucket.bucket
    this.observabilityKmsKey = observabilityBucket.kmsKey
  }
}
