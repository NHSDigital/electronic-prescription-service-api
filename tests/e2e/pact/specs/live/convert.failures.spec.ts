import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import { Bundle } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import { createUnauthorisedInteraction } from "./auth"
import * as uuid from "uuid"
import { pactOptions } from "../../resources/common"

jestpact.pactWith(
  pactOptions("live", "convert", ["failures"]),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const authenticationTestDescription = "a request to convert an unauthorised message"

    describe("endpoint authentication e2e tests", () => {
      test(authenticationTestDescription, async () => {
        const apiPath = "/$convert"
        const requestId = uuid.v4()
        const correlationId = uuid.v4()
        const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('X-Request-ID', requestId)
          .set('X-Correlation-ID', correlationId)
          .send({})
          .expect(401)
      })
    })

    describe("convert e2e tests", () => {
      test.each(TestResources.convertErrorCases)("should receive expected error code in response to %s message", async (desc: string, request: Bundle, response: string, statusCode: number) => {
        const apiPath = "/$convert"
        const requestStr = LosslessJson.stringify(request)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const interaction = {
          state: "is authenticated",
          uponReceiving: `a request to convert ${desc} message`,
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
            body: response,
            status: statusCode
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('X-Request-ID', requestId)
          .set('X-Correlation-ID', correlationId)
          .send(requestStr)
          .expect(statusCode)
      })
    })
  }
)
