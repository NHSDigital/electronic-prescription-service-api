import * as jestPact from "jest-pact"
import {pactOptions} from "../../resources/common"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {InteractionObject} from "@pact-foundation/pact"

jestPact.pactWith(
  pactOptions,
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
        const apiPath = "/Task/$release"
        const requestStr = LosslessJson.stringify(request)

        const interaction: InteractionObject = {
          state: "",
          uponReceiving: `a request to release a ${description} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: response,
            status: 200
          }
        }

        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .send(requestStr)
          .expect(statusCode)
      })
    })
  }
)
