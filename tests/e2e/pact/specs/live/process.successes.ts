import {basePath, getHeaders, pactOptions, successfulOperationOutcome} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {fhir} from "@models"

const sendProvider = new Pact(pactOptions("live", "process", "send"))

describe("process-message send e2e tests", () => {
  test.each(TestResources.processOrderCases)(
    "should be able to send %s",
    async (desc: string, bundle: fhir.Bundle) => {
      sendProvider.setup().then(async() => {
        const apiPath = `${basePath}/$process-message`

        const firstMedicationRequest = bundle.entry.map(e => e.resource)
          .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process prescription: ${prescriptionId} - ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: LosslessJson.stringify(bundle)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: "informational",
                  severity: "information"
                }
              ]
            },
            status: 200
          }
        }
        await sendProvider.addInteraction(interaction)
        await sendProvider.writePact()
      })
    })
})

const cancelProvider = new Pact(pactOptions("live", "process", "cancel"))

describe("process-message cancel e2e tests", () => {
  test.each(TestResources.processOrderUpdateCases)(
    "should be able to cancel %s",
    async (desc: string, bundle: fhir.Bundle) => {
      cancelProvider.setup().then(async() => {
        const apiPath = `${basePath}/$process-message`

        const firstMedicationRequest = bundle.entry.map(e => e.resource)
          .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to cancel prescription: ${prescriptionId} - ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: LosslessJson.stringify(bundle)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            //TODO - Verify response body for cancellations
            status: 200
          }
        }
        await cancelProvider.addInteraction(interaction)
        await cancelProvider.writePact()
      })
    }
  )
})

const dispenseProvider = new Pact(pactOptions("live", "process", "dispense"))

describe("process-message dispense e2e tests", () => {
  test.each(TestResources.processDispenseNotificationCases)(
    "should be able to dispense %s",
    async (desc: string, message: fhir.Bundle) => {
      dispenseProvider.setup().then(async() => {
        const apiPath = `${basePath}/$process-message`
        const bundleStr = LosslessJson.stringify(message)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to dispense prescription: ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: bundleStr
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: "informational",
                  severity: "information"
                }
              ]
            },
            status: 200
          }
        }
        await dispenseProvider.addInteraction(interaction)
        await dispenseProvider.writePact()
      })
    }
  )
})

const dispenseAmendProvider = new Pact(pactOptions("live", "process", "dispenseamend"))

describe("process-message dispense amend e2e tests", () => {
  test.each(TestResources.processDispenseNotificationAmendCases)(
    "should be able to dispense amend %s",
    async (desc: string, message: fhir.Bundle) => {
      dispenseAmendProvider.setup().then(async() => {
        const apiPath = `${basePath}/$process-message`
        const bundleStr = LosslessJson.stringify(message)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to dispense prescription: ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: bundleStr
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: successfulOperationOutcome, //TODO add to others
            status: 200
          }
        }
        await dispenseAmendProvider.addInteraction(interaction)
        await dispenseAmendProvider.writePact()
      })
    }
  )
})
