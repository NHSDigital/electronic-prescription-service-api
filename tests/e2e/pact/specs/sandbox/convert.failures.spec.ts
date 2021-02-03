import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions("sandbox", "convert", ["failures"]),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("convert sandbox e2e tests", () => {
      const apiPath = "/$convert"
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.convert.successes.spec.ts
      test.each(TestResources.convertCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)
=======

      test.each(TestResources.convertErrorCases)("should receive expected error code in response to %s message", async (desc: string, request: Bundle, response: string, statusCode: number) => {
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/sandbox/convert.failures.spec.ts

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)

<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.convert.successes.spec.ts
        const interaction: InteractionObject = {
=======
        const interaction = {
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/sandbox/convert.failures.spec.ts
          state: "is not authenticated",
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
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.convert.successes.spec.ts
              "Content-Type": "text/plain; charset=utf-8"
            },
            body: Matchers.regex({ matcher: responseMatcher, generate: response }),
            status: 200
=======
              "Content-Type": "application/json"
            },
            body: response,
            status: statusCode
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/sandbox/convert.failures.spec.ts
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
<<<<<<< HEAD:tests/e2e/pact/specs/sandbox/eps-sandbox.convert.successes.spec.ts
          .send(requestStr)
          .expect(200)
=======
          .send(requestJson)
          .expect(statusCode)
>>>>>>> improve_testing_tooling:tests/e2e/pact/specs/sandbox/convert.failures.spec.ts
      })
    })
  }
)
