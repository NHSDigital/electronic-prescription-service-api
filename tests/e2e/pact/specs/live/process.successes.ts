import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

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
