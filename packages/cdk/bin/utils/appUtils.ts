import {Stack, CfnResource} from "aws-cdk-lib"

// function which adds metadata to ignore things which fail cfn-guard
export const addCfnGuardMetadata = (stack: Stack, path: string, childPath: string) => {
  const provider = stack.node.tryFindChild(path)
  if (provider === undefined) {
    return
  }
  const lambda = provider.node.tryFindChild(childPath) as CfnResource
  const role = provider.node.tryFindChild("Role") as CfnResource
  if (lambda !== undefined) {
    lambda.cfnOptions.metadata = (
      {
        ...lambda.cfnOptions.metadata,
        guard: {
          SuppressedRules: [
            "LAMBDA_DLQ_CHECK",
            "LAMBDA_INSIDE_VPC",
            "LAMBDA_CONCURRENCY_CHECK"
          ]
        }
      }
    )
  }
  if (role !== undefined) {
    role.cfnOptions.metadata = (
      {
        ...role.cfnOptions.metadata,
        guard: {
          SuppressedRules: [
            "IAM_NO_INLINE_POLICY_CHECK"
          ]
        }
      }
    )
  }
}
