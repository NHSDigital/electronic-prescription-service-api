import {PactV2} from "@pact-foundation/pact"
import * as LosslessJson from "lossless-json"
import * as TestResources from "../../resources/test-resources"
import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {fhir} from "@models"

describe("sandbox release interactions", () => {
  test.each(TestResources.taskReleaseCases)(
    "should be able to acquire prescription info on a prescription release: $description",
    async (
      {description, request, response, statusCode}: {
        description: string,
        request: fhir.Parameters,
        response: fhir.Bundle,
        statusCode: number
      }
    ) => {
      const options = new CreatePactOptions("sandbox", "task", "release")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        LosslessJson.stringify(response),
        `a request to release a ${description} message`,
        statusCode
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("Task return sandbox e2e tests", () => {
  test.each(TestResources.taskReturnCases)(
    "should be able to process $description",
    async ({description, request}: {description: string, request: fhir.Task}) => {
      const options = new CreatePactOptions("sandbox", "task", "return")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to return ${description} message`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("Task withdraw sandbox e2e tests", () => {
  test.each(TestResources.taskWithdrawCases)(
    "should be able to withdraw $description",
    async ({description, request}: {description: string, request: fhir.Task}) => {
      const options = new CreatePactOptions("sandbox", "task", "withdraw")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to withdraw ${description} message`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})
