import {
  App,
  Environment,
  Fn,
  Stack,
  StackProps
} from "aws-cdk-lib"
import {ObservabilityResources} from "../resources/fame/ObservabilityResources"
import {Role} from "aws-cdk-lib/aws-iam"

export interface FameStackProps extends StackProps {
  readonly env: Environment
  readonly serviceName: string
  readonly stackName: string
  readonly version: string
}

export class FameStack extends Stack {

  public constructor(scope: App, id: string, props: FameStackProps) {
    super(scope, id, props)

    const deploymentRoleImport = Fn.importValue("ci-resources:CloudFormationDeployRole")
    const deploymentRole = Role.fromRoleArn(this, "deploymentRole", deploymentRoleImport)

    // resources
    new ObservabilityResources(this, "ObservabilityBucket", {
      stackName: props.stackName,
      deploymentRole: deploymentRole
    })
  }
}
