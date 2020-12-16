import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
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

    describe("convert e2e tests", () => {

      const convertCasesSubset = TestResources.convertCases.splice(0, 10)

      test.each(convertCasesSubset)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)

        const apiPath = "/$convert"
        const interaction: InteractionObject = {
          state: "is authenticated",
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
            body: Matchers.regex({ matcher: responseMatcher, generate: response }),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .send(requestStr)
            .expect(200)
      })
    })
  }
)