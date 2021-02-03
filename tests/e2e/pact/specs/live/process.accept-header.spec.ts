import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.process.successes.spec.ts
=======
import {processExamples} from "../../services/process-example-fetcher"
import {pactOptions} from "../../resources/common"
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/live/process.accept-header.spec.ts

jestpact.pactWith(
  pactOptions("live", "process", ["accept-header"]),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("process-message sandbox e2e tests", () => {
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.process.successes.spec.ts
      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(message)
        const interaction: InteractionObject = {
          state: "is not authenticated",
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
=======
      
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
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/live/process.accept-header.spec.ts
            },
            method: "POST",
            path: "/$process-message",
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.process.successes.spec.ts
            status: 200
=======
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
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/live/process.accept-header.spec.ts
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.process.successes.spec.ts
          .send(messageStr)
          .expect(200)
=======
          .set('Accept', 'application/fhir+json')
          .send(messageStr)
          .expect(400)
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/live/process.accept-header.spec.ts
      })
    })
  }
)
