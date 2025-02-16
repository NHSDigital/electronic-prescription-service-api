
import {Stack} from "aws-cdk-lib"
import {NagPackSuppression, NagSuppressions} from "cdk-nag"

export const nagSuppressions = (stack: Stack) => {
  safeAddNagSuppression(
    stack,
    "/prescribe-dispense/EcsCluster/Resource",
    [
      {
        id: "AwsSolutions-ECS4",
        reason: "Suppress error for not implementing CloudWatch Container Insights"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/prescribe-dispense/LoadBalancerSecurityGroup/Resource",
    [
      {
        id: "AwsSolutions-EC23",
        reason: "Suppress error for large CIDR security group"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/prescribe-dispense/ecsTasks/EcsTaskExecutionRole/Resource",
    [
      {
        id: "AwsSolutions-IAM4",
        reason: "Suppress error for using AWS managed policy"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/prescribe-dispense/ecsTasks/EcsTaskExecutionRole/DefaultPolicy/Resource",
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppress error for wildcard policy"
      }
    ]
  )

  safeAddNagSuppression(
    stack,
    "/prescribe-dispense/ecsTasks/TaskDef/Resource",
    [
      {
        id: "AwsSolutions-ECS2",
        reason: "its ok to use environment variables here"
      }
    ]
  )

}

const safeAddNagSuppression = (stack: Stack, path: string, suppressions: Array<NagPackSuppression>) => {
  try {
    NagSuppressions.addResourceSuppressionsByPath(stack, path, suppressions)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    console.log(`Could not find path ${path}`)
  }
}

// Apply the same nag suppression to multiple resources
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const safeAddNagSuppressionGroup = (stack: Stack, path: Array<string>, suppressions: Array<NagPackSuppression>) => {
  for (const p of path) {
    safeAddNagSuppression(stack, p, suppressions)
  }
}
