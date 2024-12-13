import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

describe("dispense interactions", () => {
  test.each(TestResources.taskReleaseCases)(
    "should be able to acquire prescription info on a prescription release",
    async (description: string, request: fhir.Parameters, response: fhir.Bundle, statusCode: number) => {
      const options = new CreatePactOptions("prescribing", "task", "release")
      const provider = new Pact(pactOptions(options))
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
    "should be able to process %s",
    async (desc: string, message: fhir.Task) => {
      const options = new CreatePactOptions("prescribing", "task", "return")
      const provider = new Pact(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to return ${desc} message`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)

describe("Task withdraw e2e tests", () => {
  test.each(TestResources.taskWithdrawCases)(
    "should be able to withdraw %s",
    async (desc: string, message: fhir.Task) => {
      const options = new CreatePactOptions("prescribing", "task", "withdraw")
      const provider = new Pact(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to withdraw ${desc} message`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)
