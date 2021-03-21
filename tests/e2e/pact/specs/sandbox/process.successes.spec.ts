import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import * as TestResources from "../../resources/test-resources"
import {basePath, pactOptions} from "../../resources/common"
import * as fhir from "@models/fhir"

TestResources.processOrderCaseGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("sandbox", "process", pactGroupName, "send"),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message sandbox e2e tests", () => {
        test.each(pactGroupTestCases)(
          "should be able to process %s",
          async (desc: string, message: fhir.Bundle) => {
            const apiPath = `${basePath}/$process-message`
            const messageStr = LosslessJson.stringify(message)
            const requestId = uuid.v4()
            const correlationId = uuid.v4()
            const interaction: InteractionObject = {
              state: "is not authenticated",
              uponReceiving: `a request to process ${desc} message to Spine`,
              withRequest: {
                headers: {
                  "Content-Type": "application/fhir+json; fhirVersion=4.0",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
                },
                method: "POST",
                path: apiPath,
                body: JSON.parse(messageStr)
              },
              willRespondWith: {
                headers: {
                  "Content-Type": "application/json",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
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
              .send(messageStr)
              .expect(200)
          }
        )
      })
    }
  )
})

TestResources.processOrderUpdateCaseGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("sandbox", "process", pactGroupName, "cancel"),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message sandbox e2e tests", () => {
        test.each(pactGroupTestCases)(
          "should be able to process %s",
          async (desc: string, message: fhir.Bundle) => {
            const apiPath = `${basePath}/$process-message`
            const messageStr = LosslessJson.stringify(message)
            const requestId = uuid.v4()
            const correlationId = uuid.v4()
            const interaction: InteractionObject = {
              state: "is not authenticated",
              uponReceiving: `a request to process ${desc} message to Spine`,
              withRequest: {
                headers: {
                  "Content-Type": "application/fhir+json; fhirVersion=4.0",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
                },
                method: "POST",
                path: apiPath,
                body: JSON.parse(messageStr)
              },
              willRespondWith: {
                headers: {
                  "Content-Type": "application/json",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
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
              .send(messageStr)
              .expect(200)
          }
        )
      })
    }
  )
})

TestResources.processDispenseNotificationCaseGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("sandbox", "process", pactGroupName, "dispense"),
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
              uponReceiving: `a request to process ${desc} message to Spine`,
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
          }
        )
      }
    })
  })
})
