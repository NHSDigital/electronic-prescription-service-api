import * as jestpact from "jest-pact"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import * as uuid from "uuid"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import * as LosslessJson from "lossless-json"
import {InteractionObject} from "@pact-foundation/pact"

jestpact.pactWith(
  pactOptions("sandbox", "process", "claim"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("process-message claim sandbox e2e tests", () => {
      test.each(TestResources.claimCases)(
        "should be able to claim %s",
        async (desc: string, message: fhir.Claim) => {
          const apiPath = `${basePath}/Claim`
          const claimStr = LosslessJson.stringify(message)
          const claim = JSON.parse(claimStr) as fhir.Claim

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
              body: claim
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json"
              },
              //TODO - Verify response body for claims
              status: 200
            }
          }
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(claimStr)
            .expect(200)
        }
      )
    })
  })
