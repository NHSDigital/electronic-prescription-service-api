import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
import {generateShortFormId, processExamples, setPrescriptionIds} from "../../services/process-example-fetcher"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions("live", "process", "accept_headers"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("process-message sandbox e2e tests", () => {

      test("Should be able to process a FHIR JSON Accept header", async () => {
        const testCase = processExamples[0]
        const apiPath = `${basePath}/$process-message`
        const requestCopy = LosslessJson.parse(LosslessJson.stringify(testCase.request))
        setPrescriptionIds(requestCopy, uuid.v4(), generateShortFormId(), uuid.v4())
        const messageStr = LosslessJson.stringify(requestCopy)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process a message with a FHIR JSON Accept header`,
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
          .set("Accept", "application/fhir+json")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .send(messageStr)
          .expect(200)
      })
    })
  }
)
