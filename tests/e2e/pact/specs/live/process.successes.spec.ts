import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle, MedicationRequest} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import {regeneratePrescriptionIds} from "../../services/process-example-fetcher"

regeneratePrescriptionIds()

const orderPactGroups = [
  {
    name: "secondarycare-community-acute",
    cases: TestResources.processSecondaryCareCommunityAcuteOrderCases,
  },
  {
    name: "secondarycare-community-repeatdispensing",
    cases: TestResources.processSecondaryCareCommunityRepeatDispensingOrderCases,
  },
  {
    name: "secondarycare-homecare",
    cases: TestResources.processSecondaryCareHomecareOrderCases,
  }
]

const orderUpdatePactGroups = [
  {
    name: "secondarycare-community-acute-cancel",
    cases: TestResources.processSecondaryCareCommunityAcuteOrderUpdateCases
  },
  {
    name: "secondarycare-homecare-cancel",
    cases: TestResources.processSecondaryCareHomecareOrderUpdateCases
  }
]

orderPactGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("live", "process", [pactGroupName]),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message e2e tests", () => {
        test.each(pactGroupTestCases)("should be able to process %s", async (desc: string, message: Bundle) => {
          const apiPath = `${basePath}/$process-message`
          const bundleStr = LosslessJson.stringify(message)
          const bundle = JSON.parse(bundleStr) as Bundle

          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const firstMedicationRequest = message.entry.map(e => e.resource)
            .find(r => r.resourceType == "MedicationRequest") as MedicationRequest
          const prescriptionId = firstMedicationRequest.groupIdentifier.value

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to process prescription: ${prescriptionId} - ${desc} message to Spine`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              method: "POST",
              path: apiPath,
              body: bundle
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json"
              },
              body: {
                resourceType: "OperationOutcome",
                issue: [
                  {
                    code: "informational",
                    severity: "information",
                  }
                ]
              },
              status: 200
            }
          }
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(bundleStr)
            .expect(200)
        })
      })
    }
  )
})

orderUpdatePactGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("live", "process", [pactGroupName]),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message e2e tests", () => {
        if (pactGroupTestCases.length) {
          test.each(pactGroupTestCases)("should be able to process %s", async (desc: string, message: Bundle) => {
            const apiPath = `${basePath}/$process-message`
            const bundleStr = LosslessJson.stringify(message)
            const bundle = JSON.parse(bundleStr) as Bundle

            const requestId = uuid.v4()
            const correlationId = uuid.v4()

            const firstMedicationRequest = message.entry.map(e => e.resource)
              .find(r => r.resourceType == "MedicationRequest") as MedicationRequest
            const prescriptionId = firstMedicationRequest.groupIdentifier.value

            const interaction: InteractionObject = {
              state: "is authenticated",
              uponReceiving: `a request to process prescription: ${prescriptionId} - ${desc} message to Spine`,
              withRequest: {
                headers: {
                  "Content-Type": "application/fhir+json; fhirVersion=4.0",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
                },
                method: "POST",
                path: apiPath,
                body: bundle
              },
              willRespondWith: {
                headers: {
                  "Content-Type": "application/json"
                },
                //TODO - Verify response body for cancellations
                status: 200
              }
            }
            await provider.addInteraction(interaction)
            await client()
              .post(apiPath)
              .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
              .set("X-Request-ID", requestId)
              .set("X-Correlation-ID", correlationId)
              .send(bundleStr)
              .expect(200)
          })
        }
      })
    }
  )
})
