import {
  App,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {Observability} from "../resources/Observability"
import {ManagedPolicy, Role} from "aws-cdk-lib/aws-iam"
import {Bucket} from "aws-cdk-lib/aws-s3"

export interface StatefulResourcesStackProps extends StackProps {
  readonly stackName: string
}

export class StatefulResourcesStack extends Stack {
  public readonly observabilityBucketArn: string
  public readonly observabilityBucketWritePolicy: ManagedPolicy
  public readonly observabilityRoutes: string

  public constructor(scope: App, id: string, props: StatefulResourcesStackProps) {
    super(scope, id, props)

    // Context
    const deploymentRoleImport = Fn.importValue("ci-resources:CloudFormationDeployRole")
    const deploymentRole = Role.fromRoleArn(this, "deploymentRole", deploymentRoleImport)

    const auditLoggingBucketImport = Fn.importValue("account-resources:AuditLoggingBucket")
    const auditLoggingBucket = Bucket.fromBucketArn(this, "AuditLoggingBucket", auditLoggingBucketImport)

    // resources
    new Observability(this, "Observability", {
      stackName: props.stackName,
      deploymentRole: deploymentRole,
      auditLoggingBucket: auditLoggingBucket
    })
  }
}
