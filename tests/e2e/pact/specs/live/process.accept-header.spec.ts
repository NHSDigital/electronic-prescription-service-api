import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
import {processExamples} from "../../services/process-example-fetcher"
import {pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions("live", "process", "accept-header"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("process-message sandbox e2e tests", () => {
      
      test("Should be able to process a FHIR JSON Accept header", async () => {
        const testCase = processExamples[0]

        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(testCase.request)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process a message with a FHIR JSON Accept header`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Accept": "application/fhir+json"
            },
            method: "POST",
            path: "/$process-message",
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: "invalid",
                  severity: "error",
                  details: {
                    coding: [
                      {
                        code: "202",
                        display: "Duplicate HL7 ID Error"
                      }
                    ]
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
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('Accept', 'application/fhir+json')
          .send(messageStr)
          .expect(400)
      })
    })
  }
)
