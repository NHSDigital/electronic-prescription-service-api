import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle} from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps-convert+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const apiPath = "/$convert"

    describe("convert e2e tests", () => {
      const successfulCases = TestResources.convertCases.filter(convertCase => convertCase[4] === "200-OK")
      const errorCases = TestResources.convertCases.filter(convertCase => convertCase[4] !== "200-OK")

      test.each(successfulCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)

        const interaction = {
          state: null,
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: apiPath,
            body: requestJson
          },
          willRespondWith: {
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            },
            body: Matchers.term({ generate: response, matcher: responseMatcher }),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(requestJson)
          .expect(200)
      })

      test.each(errorCases)("should receive expected error code in response to %s message", async (desc: string, request: Bundle, response: string, responseMatcher: string, statusCode: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)

        const interaction = {
          state: null,
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: apiPath,
            body: requestJson
          },
          willRespondWith: {
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            },
            body: Matchers.term({ generate: response, matcher: responseMatcher }),
            status: parseInt(statusCode)
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(requestJson)
          .expect(parseInt(statusCode))
      })
    })
  }
)
