import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions(true, "convert"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("convert sandbox e2e tests", () => {
      const apiPath = "/$convert"
      test.each(TestResources.convertCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestId = uuid.v4()

        const interaction: InteractionObject = {
          state: "is not authenticated",
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "X-Request-ID": requestId
            },
            body: Matchers.regex({ matcher: responseMatcher, generate: response }),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('X-Request-ID', requestId)
          .send(requestStr)
          .expect(200)
      })

      test.each(TestResources.convertErrorCases)("should receive expected error code in response to %s message", async (desc: string, request: Bundle, response: string, statusCode: number) => {

        const requestStr = LosslessJson.stringify(request)
        const requestId = uuid.v4()

        const interaction = {
          state: "is not authenticated",
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId
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
          .send(requestStr)
          .expect(statusCode)
      })
    })
  }
)
