import {
  App,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {Observability} from "../resources/Observability"
import {Role} from "aws-cdk-lib/aws-iam"
import {Bucket} from "aws-cdk-lib/aws-s3"

export interface StatefulResourcesStackProps extends StackProps {
  readonly stackName: string
}

export class StatefulResourcesStack extends Stack {

  public constructor(scope: App, id: string, props: StatefulResourcesStackProps) {
    super(scope, id, props)

    // Context
    const deploymentRoleImport = Fn.importValue("iam-cdk:IAM:CloudFormationDeployRole:Arn")
    const deploymentRole = Role.fromRoleArn(this, "deploymentRole", deploymentRoleImport)

    const auditLoggingBucketImport = Fn.importValue("account-resources-cdk-uk:Bucket:AuditLoggingBucket:Arn")
    const auditLoggingBucket = Bucket.fromBucketArn(this, "AuditLoggingBucket", auditLoggingBucketImport)

    // resources
    new Observability(this, "Observability", {
      stackName: props.stackName,
      deploymentRole: deploymentRole,
      auditLoggingBucket: auditLoggingBucket
    })
  }
}
