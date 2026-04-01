import {PactV2} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {fetcher, fhir} from "@models"
import {generateTestOutputFile} from "../../services/genereate-test-output-file"

beforeAll(async () => {
  await generateTestOutputFile()
})

describe("process-message send sandbox e2e tests", () => {
  test.each(TestResources.processOrderCases)(
    "should be able to send $description",
    async ({description, request}: {description: string, request: fhir.Bundle}) => {
      const options = new CreatePactOptions("sandbox", "process", "send")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to process ${description} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message cancel sandbox e2e tests", () => {
  test.each(TestResources.processOrderUpdateCases)(
    "should be able to cancel $description",
    async ({description, request}: {description: string, request: fhir.Bundle}) => {
      const options = new CreatePactOptions("sandbox", "process", "cancel")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        undefined,
        `a request to send ${description} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message dispense sandbox e2e tests", () => {
  test.each(TestResources.processDispenseNotificationCases)(
    "should be able to dispense $description",
    async ({description, request}: {description: string, request: fhir.Bundle}) => {
      const options = new CreatePactOptions("sandbox", "process", "dispense")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to process ${description} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message dispense amend sandbox e2e tests", () => {
  test.each(TestResources.processDispenseNotificationCases)(
    "should be able to dispense amend $description",
    async ({description, request}: {description: string, request: fhir.Bundle}) => {
      const options = new CreatePactOptions("sandbox", "process", "dispenseamend")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to process ${description} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message accept-header sandbox e2e tests", () => {
  test("Should be able to process a FHIR JSON Accept header", async () => {
    const testCase = fetcher.processExamples[0]

    const options = new CreatePactOptions("sandbox", "process", "send")
    const provider = new PactV2(pactOptions(options))
    await provider.setup()

    const interaction = createInteraction(
      options,
      testCase.request,
      successfulOperationOutcome,
      `a request to process a message with a FHIR JSON Accept header`
    )
    interaction.withRequest.headers = {
      ...interaction.withRequest.headers,
      "Accept": "application/fhir+json"
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
