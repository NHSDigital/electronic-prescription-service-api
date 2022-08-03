import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

const releaseOptions = new CreatePactOptions("live", "task", "release")
const releaseProvider = new Pact(pactOptions(releaseOptions))

describe("dispense interactions", () => {
  test.each(TestResources.taskReleaseCases)(
    "should be able to acquire prescription info on a prescription release",
    async (description: string, request: fhir.Parameters, response: fhir.Bundle, statusCode: number) => {
      releaseProvider.setup().then(async() => {
        const interaction = createInteraction(
          releaseOptions,
          request,
          JSON.stringify(response),
          `a request to release a ${description} message`,
          statusCode
        )
        await releaseProvider.addInteraction(interaction)
        await releaseProvider.writePact()
      })
    }
  )
})

const returnOptions = new CreatePactOptions("live", "task", "return")
const returnProvider = new Pact(pactOptions(returnOptions))

describe("Task return e2e tests", () => {
  test.each(TestResources.taskReturnCases)(
    "should be able to process %s",
    async (desc: string, message: fhir.Task) => {
      returnProvider.setup().then(async() => {
        const interaction = createInteraction(
          returnOptions,
          message,
          successfulOperationOutcome,
          `a request to return ${desc} message`
        )
        await returnProvider.addInteraction(interaction)
        await returnProvider.writePact()
      })
    }
  )
})

const withdrawOptions = new CreatePactOptions("live", "task", "withdraw")
const withdrawProvider = new Pact(pactOptions(withdrawOptions))

describe("Task withdraw e2e tests", () => {
  test.each(TestResources.taskWithdrawCases)(
    "should be able to withdraw %s",
    async (desc: string, message: fhir.Task) => {
      withdrawProvider.setup().then(async() => {
        const interaction = createInteraction(
          withdrawOptions,
          message,
          successfulOperationOutcome,
          `a request to withdraw ${desc} message`
        )
        await withdrawProvider.addInteraction(interaction)
        await withdrawProvider.writePact()
      })
    }
  )
})
