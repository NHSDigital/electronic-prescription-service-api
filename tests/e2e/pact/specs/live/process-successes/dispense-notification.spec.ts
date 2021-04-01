import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../../resources/common"
import {fhir} from "@models"
import {updatePrescriptions} from "../../../services/update-prescriptions"

(async () => {
  if (process.env.UPDATE_PRESCRIPTIONS !== "false") {
    await updatePrescriptions()
  }
})()

TestResources.processDispenseNotificationCaseGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("live", "process", pactGroupName, "dispense"),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message e2e tests", () => {
        if (pactGroupTestCases.length) {
          test.each(pactGroupTestCases)("should be able to process %s", async (desc: string, message: fhir.Bundle) => {
            const apiPath = `${basePath}/$process-message`
            const bundleStr = LosslessJson.stringify(message)
            const bundle = JSON.parse(bundleStr) as fhir.Bundle

            const requestId = uuid.v4()
            const correlationId = uuid.v4()

            const interaction: InteractionObject = {
              state: "is authenticated",
              uponReceiving: `a request to process prescription: ${desc} message to Spine`,
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
                //TODO - Verify response body for dispensation
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

          test("should return xml on present header", async () => {
            const desc = pactGroupTestCases[0][0]
            const message = pactGroupTestCases[0][1]

            const apiPath = `${basePath}/$process-message`
            const bundleStr = LosslessJson.stringify(message)
            const bundle = JSON.parse(bundleStr) as fhir.Bundle

            const requestId = uuid.v4()
            const correlationId = uuid.v4()

            const interaction: InteractionObject = {
              state: "is authenticated",
              uponReceiving: `a request to process prescription: ${desc} message to Spine - response xml`,
              withRequest: {
                headers: {
                  "Content-Type": "application/fhir+json; fhirVersion=4.0",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId,
                  "X-Untranslated-Response": "true"
                },
                method: "POST",
                path: apiPath,
                body: bundle
              },
              willRespondWith: {
                headers: {
                  "Content-Type": "application/xml"
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
              .set("X-Untranslated-Response", "true")
              .send(bundleStr)
              .expect(200)
          })
        }
      })
    })
})
