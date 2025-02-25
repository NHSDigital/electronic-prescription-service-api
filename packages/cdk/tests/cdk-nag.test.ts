import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import {AwsSolutionsChecks} from "cdk-nag"
import {Aspects, Stack} from "aws-cdk-lib"
import {Bucket} from "aws-cdk-lib/aws-s3"
import {
  expect,
  describe,
  test,
  beforeAll
} from "@jest/globals"
import {Match, Annotations} from "aws-cdk-lib/assertions"

// cdk-nag has some issues if multiple versions of aws-cdk-lib are installed
// sse https://github.com/cdklabs/cdk-nag/issues/1219
// this is just a test to make sure that cdk-nag is working correctly
// and 2 errors are thrown from a simple stack

class CdkTestStack extends cdk.Stack {
  public constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    new Bucket(this, "Bucket")
  }
}

describe("cdk-nag works correctly", () => {
  let stack: Stack
  let app: cdk.App
  // In this case we can use beforeAll() over beforeEach() since our tests
  // do not modify the state of the application
  beforeAll(() => {
    // GIVEN
    app = new cdk.App()
    stack = new CdkTestStack(app, "test")

    // WHEN
    Aspects.of(stack).add(new AwsSolutionsChecks())
  })

  // THEN
  test("No unsuppressed Warnings", () => {
    const warnings = Annotations.fromStack(stack).findWarning(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*")
    )
    expect(warnings).toHaveLength(0)
  })

  test("2 unsuppressed Errors", () => {
    const errors = Annotations.fromStack(stack).findError(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*")
    )
    expect(errors).toHaveLength(2)
  })
})
