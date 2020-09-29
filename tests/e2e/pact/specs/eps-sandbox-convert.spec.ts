import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle} from "../resources/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.BUILD_VERSION}`,
    provider: `nhsd-apim-eps-sandbox-convert+${process.env.BUILD_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("convert sandbox e2e tests", () => {

      test.each(TestResources.convertCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)
        
        const apiPath = "/$convert"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$convert",
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
          .set('NHSD-Session-URID', '1234')
          .send(requestJson)
          .expect(200)
      })
    })
  }
)
