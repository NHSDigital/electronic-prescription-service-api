import {
  App,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {Observability} from "../resources/Observability"
import {Role} from "aws-cdk-lib/aws-iam"
import {Bucket} from "aws-cdk-lib/aws-s3"
import {ContainerDefinition} from "aws-cdk-lib/aws-ecs"

export interface StatefulResourcesStackProps extends StackProps {
  readonly stackName: string
  readonly ecsTaskExecutionRole: Role
  readonly coordinatorContainer: ContainerDefinition
}

export class StatefulResourcesStack extends Stack {

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
      auditLoggingBucket: auditLoggingBucket,
      ecsTaskExecutionRole: props.ecsTaskExecutionRole,
      coordinatorContainer: props.coordinatorContainer
    })
  }
}
