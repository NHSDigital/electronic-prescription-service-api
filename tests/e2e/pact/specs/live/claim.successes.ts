import * as jestpact from "jest-pact"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {InteractionObject} from "@pact-foundation/pact"

jestpact.pactWith(
  pactOptions("live", "process", "claim"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("claim e2e tests", () => {
      test.each(TestResources.claimCases)(
        "should be able to claim for %s",
        async (desc: string, message: fhir.Claim) => {
          const apiPath = `${basePath}/Claim`
          const claimStr = LosslessJson.stringify(message)
          const claim = JSON.parse(claimStr) as fhir.Claim

          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to claim for prescription: ${desc} message to Spine`,
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
