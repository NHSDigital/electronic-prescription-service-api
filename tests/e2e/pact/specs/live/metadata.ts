import * as jestpact from "jest-pact"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import {InteractionObject, Matchers} from "@pact-foundation/pact"

jestpact.pactWith(
  pactOptions("live", "metadata"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("metadata e2e tests", () => {
      test("should respond with 200", async () => {
        const apiPath = `${basePath}/metadata`
        const requestId = uuid.v4()

        const responseBody = {
          "resourceType": "CapabilityStatement",
          "extension": [
            {
              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition",
              "extension": Matchers.eachLike(
                {
                  "url": "implementationGuide",
                  "extension": [
                    {
                      "url": "name",
                      "valueString": Matchers.like("uk.nhsdigital.medicines.r4")
                    }, {
                      "url": "version",
                      "valueString": Matchers.like("2.1.14-alpha")
                    }
                  ]
                }, {min: 4}
              )
            }
          ]
        }

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: "a valid FHIR message",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId
            },
            method: "GET",
            path: apiPath
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: responseBody,
            status: 200
          }
        }

        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("Accept", "application/fhir+json")
          .set("X-Request-ID", requestId)
          .set("X-Skip-Validation", "true")
          .expect(200)
      })
    })
  }
)
