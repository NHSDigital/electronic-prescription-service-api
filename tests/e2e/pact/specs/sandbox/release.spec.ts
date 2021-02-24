import * as jestPact from "jest-pact"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {InteractionObject} from "@pact-foundation/pact"
import * as uuid from "uuid"
import * as fhir from "../../models/fhir"

jestPact.pactWith(
  pactOptions("sandbox", "release"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = provider.mockService.baseUrl
      return supertest(url)
    }

    describe("sandbox dispense interactions", () => {
      test.each(TestResources.releaseCases)(
        "should be able to acquire prescription info on a prescription release",
        async (description: string, request: fhir.Parameters, response: fhir.Bundle, statusCode: string) => {
          const apiPath = `${basePath}/Task/$release`
          const requestStr = LosslessJson.stringify(request)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is not authenticated",
            uponReceiving: `a request to release a ${description} message`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              method: "POST",
              path: apiPath,
              body: JSON.parse(requestStr)
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              body: {
                "code": "invalid",
                "severity": "error",
                "details": [{
                  "code": "",
                  "display": "Release interaction"
                }]
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
            .send(requestStr)
            .expect(statusCode)
        }
      )
    })
  }
)
