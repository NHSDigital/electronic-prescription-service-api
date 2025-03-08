
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

  safeAddNagSuppressionGroup(
    stack,
    [
      "/prescribe-dispense/fhirFacadeService/LB/SecurityGroup/Resource",
      "/prescribe-dispense/claimsService/LB/SecurityGroup/Resource"
    ],
    [
      {
        id: "AwsSolutions-EC23",
        reason: "Suppress error for large CIDR security group"
      }
    ]
  )

  safeAddNagSuppressionGroup(
    stack,
    [
      "/prescribe-dispense/ecsTasks/EcsTaskExecutionRole/Resource",
      "/prescribe-dispense/claimsEcsTasks/EcsTaskExecutionRole/Resource"
    ],
    [
      {
        id: "AwsSolutions-IAM4",
        reason: "Suppress error for using AWS managed policy"
      }
    ]
  )

  safeAddNagSuppressionGroup(
    stack,
    [
      "/prescribe-dispense/ecsTasks/EcsTaskExecutionRole/DefaultPolicy/Resource",
      "/prescribe-dispense/claimsEcsTasks/EcsTaskExecutionRole/DefaultPolicy/Resource"
    ],
    [
      {
        id: "AwsSolutions-IAM5",
        reason: "Suppress error for wildcard policy"
      }
    ]
  )

  safeAddNagSuppressionGroup(
    stack,
    [
      "/prescribe-dispense/ecsTasks/TaskDef/Resource",
      "/prescribe-dispense/claimsEcsTasks/TaskDef/Resource"
    ],
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
const safeAddNagSuppressionGroup = (stack: Stack, path: Array<string>, suppressions: Array<NagPackSuppression>) => {
  for (const p of path) {
    safeAddNagSuppression(stack, p, suppressions)
  }
}
