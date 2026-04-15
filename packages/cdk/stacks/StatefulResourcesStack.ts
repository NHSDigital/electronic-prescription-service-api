import {
  App,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {ObservabilityBucket} from "../resources/ObservabilityBucket"
import {Role} from "aws-cdk-lib/aws-iam"

export interface StatefulResourcesStackProps extends StackProps {
  readonly stackName: string
}

export class StatefulResourcesStack extends Stack {

  public constructor(scope: App, id: string, props: StatefulResourcesStackProps) {
    super(scope, id, props)

    // Context
    const deploymentRoleImport = Fn.importValue("ci-resources:CloudFormationDeployRole")
    const deploymentRole = Role.fromRoleArn(this, "deploymentRole", deploymentRoleImport)

    // resources
    new ObservabilityBucket(this, "ObservabilityBucket", {
      stackName: props.stackName,
      deploymentRole: deploymentRole
    })
  }
}
