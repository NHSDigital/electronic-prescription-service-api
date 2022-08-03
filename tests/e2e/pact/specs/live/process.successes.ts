import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fetcher, fhir} from "@models"

const sendOptions = new CreatePactOptions("live", "process", "send")
const sendProvider = new Pact(pactOptions(sendOptions))

describe("process-message send e2e tests", () => {
  test.each(TestResources.processOrderCases)(
    "should be able to send %s",
    async (desc: string, bundle: fhir.Bundle) => {
      sendProvider.setup().then(async() => {

        const firstMedicationRequest = bundle.entry.map(e => e.resource)
          .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction = createInteraction(
          sendOptions,
          bundle,
          successfulOperationOutcome,
          `a request to process prescription: ${prescriptionId} - ${desc} message to Spine`
        )

        await sendProvider.addInteraction(interaction)
        await sendProvider.writePact()
      })
    })
})

const cancelOptions = new CreatePactOptions("live", "process", "cancel")
const cancelProvider = new Pact(pactOptions(cancelOptions))

describe("process-message cancel e2e tests", () => {
  test.each(TestResources.processOrderUpdateCases)(
    "should be able to cancel %s",
    async (desc: string, bundle: fhir.Bundle) => {
      cancelProvider.setup().then(async() => {

        const firstMedicationRequest = bundle.entry.map(e => e.resource)
          .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction = createInteraction(
          sendOptions,
          bundle,
          successfulOperationOutcome,
          `a request to cancel prescription: ${prescriptionId} - ${desc} message to Spine`
        )

        await cancelProvider.addInteraction(interaction)
        await cancelProvider.writePact()
      })
    }
  )
})

const dispenseOptions = new CreatePactOptions("live", "process", "dispense")
const dispenseProvider = new Pact(pactOptions(dispenseOptions))

describe("process-message dispense e2e tests", () => {
  test.each(TestResources.processDispenseNotificationCases)(
    "should be able to dispense %s",
    async (desc: string, message: fhir.Bundle) => {
      dispenseProvider.setup().then(async() => {
        const interaction = createInteraction(
          sendOptions,
          message,
          successfulOperationOutcome,
          `a request to dispense prescription: ${desc} message to Spine`
        )
        await dispenseProvider.addInteraction(interaction)
        await dispenseProvider.writePact()
      })
    }
  )
})

const dispenseAmendOptions = new CreatePactOptions("live", "process", "dispenseamend")
const dispenseAmendProvider = new Pact(pactOptions(dispenseAmendOptions))

describe("process-message dispense amend e2e tests", () => {
  test.each(TestResources.processDispenseNotificationAmendCases)(
    "should be able to dispense amend %s",
    async (desc: string, message: fhir.Bundle) => {
      dispenseAmendProvider.setup().then(async() => {
        const interaction = createInteraction(
          sendOptions,
          message,
          successfulOperationOutcome,
          `a request to amend a dispense for prescription: ${desc} message to Spine`
        )
        await dispenseAmendProvider.addInteraction(interaction)
        await dispenseAmendProvider.writePact()
      })
    }
  )
})

describe("process-message accept-header live e2e tests", () => {

  // todo: reinstate prescription id update
  test.skip("Should be able to process a FHIR JSON Accept header", async () => {
    const testCase = fetcher.processExamples[0]

    const options = new CreatePactOptions("live", "process", "send")
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
