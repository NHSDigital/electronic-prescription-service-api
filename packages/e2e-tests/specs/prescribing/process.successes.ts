import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fetcher, fhir} from "@models"

describe("process-message send e2e tests", () => {
  test.each(TestResources.processOrderCases)(
    "should be able to send %s",
    async (desc: string, bundle: fhir.Bundle) => {
      const options = new CreatePactOptions("prescribing", "process", "send")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const firstMedicationRequest = bundle.entry.map(e => e.resource)
        .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
      const prescriptionId = firstMedicationRequest.groupIdentifier.value

      const interaction = createInteraction(
        options,
        bundle,
        successfulOperationOutcome,
        `a request to process prescription: ${prescriptionId} - ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
})

describe("process-message cancel e2e tests", () => {
  test.each(TestResources.processOrderUpdateCases)(
    "should be able to cancel %s",
    async (desc: string, bundle: fhir.Bundle) => {
      const options = new CreatePactOptions("prescribing", "process", "cancel")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const firstMedicationRequest = bundle.entry.map(e => e.resource)
        .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
      const prescriptionId = firstMedicationRequest.groupIdentifier.value

      const interaction = createInteraction(
        options,
        bundle,
        undefined,
        `a request to cancel prescription: ${prescriptionId} - ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message dispense e2e tests", () => {
  test.each(TestResources.processDispenseNotificationCases)(
    "should be able to dispense %s",
    async (desc: string, message: fhir.Bundle) => {
      const options = new CreatePactOptions("prescribing", "process", "dispense")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to dispense prescription: ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
})

describe("process-message dispense amend e2e tests", () => {
  test.each(TestResources.processDispenseNotificationAmendCases)(
    "should be able to dispense amend %s",
    async (desc: string, message: fhir.Bundle) => {
      const options = new CreatePactOptions("prescribing", "process", "dispenseamend")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to amend a dispense for prescription: ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
})

describe("process-message accept-header prescribing e2e tests", () => {

  // todo: reinstate prescription id update
  test.skip("Should be able to process a FHIR JSON Accept header", async () => {
    const testCase = fetcher.processExamples[0]

    const options = new CreatePactOptions("prescribing", "process", "send")
    const provider = new Pact(pactOptions(options))
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
