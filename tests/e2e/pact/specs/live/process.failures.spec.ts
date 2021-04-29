import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import {basePath, pactOptions} from "../../resources/common"
import * as uuid from "uuid"
import {createUnauthorisedInteraction} from "./auth"
import * as LosslessJson from "lossless-json"
import {fhir} from "@models"
import * as TestResources from "../../resources/test-resources"

jestpact.pactWith(
  pactOptions("live", "process", "send"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const authenticationTestDescription = "a request to process an unauthorised message"

    describe("endpoint authentication e2e tests", () => {
      test(authenticationTestDescription, async () => {
        const apiPath = `${basePath}/$process-message`
        const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .send({})
          .expect(401)
      })
    })

    describe("ensure errors are translated", () => {
      test("EPS Prescribe error 0003", async () => {
        const apiPath = `${basePath}/$process-message`
        const message = TestResources.prepareCaseBundles[0][1] as fhir.Bundle
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as fhir.Bundle

        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const firstMedicationRequest = message.entry.map(e => e.resource)
          .find(r => r.resourceType == "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process prescription: ${prescriptionId} - No digital signature message to Spine`,
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
                  code: "business-rule",
                  severity: "error",
                  details: {
                    coding: [{
                      system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
                      code: "MISSING_DIGITAL_SIGNATURE",
                      display: "Digital signature not found"
                    }]
                  }
                }
              ]
            },
            status: 400
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .send(bundleStr)
          .expect(400)
      })

      test("EPS Prescribe error 5009", async () => {
        const apiPath = `${basePath}/$process-message`
        const message = TestResources.processErrorCases[0][1] as fhir.Bundle
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as fhir.Bundle

        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const firstMedicationRequest = message.entry.map(e => e.resource)
          .find(r => r.resourceType == "MedicationRequest") as fhir.MedicationRequest
        const prescriptionId = firstMedicationRequest.groupIdentifier.value

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process prescription: ${prescriptionId} - Invalid check digit`,
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
                  code: "value",
                  severity: "error",
                  details: {
                    coding: [{
                      system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
                      code: "INVALID_CHECK_DIGIT",
                      display: "Error in check digit"
                    }]
                  }
                }
              ]
            },
            status: 400
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .send(bundleStr)
          .expect(400)
      })
    })
  }
)
