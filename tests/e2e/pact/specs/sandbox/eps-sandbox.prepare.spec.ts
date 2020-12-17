import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle, Parameters} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps-sandbox+prepare+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "merge"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("prepare sandbox e2e tests", () => {

      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (description: string, request: Bundle, response: Parameters) => {
        const apiPath = "/$prepare"
        const requestStr = LosslessJson.stringify(request)

        const outputMessageDigest = response.parameter
          .find(p => p.name === "digest").valueString
        const outputMessageFragments = response.parameter
          .find(p => p.name === "fragments").valueString
        const outputMessageDisplay = response.parameter
          .find(p => p.name === "display").valueString
          
        const interaction: InteractionObject = {
          state: "is not authenticated",
          uponReceiving: `a request to prepare a ${description} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              resourceType: "Parameters",
              parameter: [
                {
                  name: "fragments",
                  valueString: Matchers.like(outputMessageFragments)
                },
                {
                  name: "digest",
                  valueString: `${outputMessageDigest}`
                },
                {
                  name: "display",
                  valueString: Matchers.like(outputMessageDisplay)
                },
                {
                  name: "algorithm",
                  valueString: "RS1"
                }
              ]
            },
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
