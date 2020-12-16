import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import { Bundle } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "merge"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("process-message e2e tests", () => {
      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as Bundle

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$process-message",
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
          .send(bundleStr)
          .expect(400)
      })
    })
  }
)