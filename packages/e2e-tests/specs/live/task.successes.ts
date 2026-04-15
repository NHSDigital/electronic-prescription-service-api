import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {PactV2} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

describe("dispense interactions", () => {
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
      const options = new CreatePactOptions("live", "task", "release")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        request,
        JSON.stringify(response),
        `a request to release a ${description} message`,
        statusCode
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)

describe("Task return e2e tests", () => {
  test.each(TestResources.taskReturnCases)(
    "should be able to process $description",
    async ({description, request}: {description: string, request: fhir.Task}) => {
      const options = new CreatePactOptions("live", "task", "return")
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
    })
}
)

describe("Task withdraw e2e tests", () => {
  test.each(TestResources.taskWithdrawCases)(
    "should be able to withdraw $description",
    async ({description, request}: {description: string, request: fhir.Task}) => {
      const options = new CreatePactOptions("live", "task", "withdraw")
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
    })
}
)
