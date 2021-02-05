import * as jestPact from "jest-pact"
import {pactOptions} from "../../resources/common"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {InteractionObject} from "@pact-foundation/pact"
import * as uuid from "uuid"

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
          const apiPath = "/Task/$release"
          const requestStr = LosslessJson.stringify(request)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "",
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
                "resourceType": "Bundle",
                "type": "searchset",
                "total": 2,
                "id": "d5a20db9-6d76-4aeb-a190-9a85843b01bf",
                "identifier": {
                  "value": "d5a20db9-6d76-4aeb-a190-9a85843b01bf"
                },
                "entry": [
                  {
                    "resource": {
                      "resourceType": "Bundle",
                      "type": "message",
                      "id": "eff31db2-a914-44a9-b89d-1a33f6de727e",
                      "identifier": {
                        "value": "eff31db2-a914-44a9-b89d-1a33f6de727e"
                      }
                    },
                    "fullUrl": "urn:uuid:eff31db2-a914-44a9-b89d-1a33f6de727e"
                  },
                  {
                    "resource": {
                      "resourceType": "Bundle",
                      "type": "message",
                      "id": "f6f2fd4a-0f5a-4cee-82a0-e6d08d64c2b4",
                      "identifier": {
                        "value": "f6f2fd4a-0f5a-4cee-82a0-e6d08d64c2b4"
                      }
                    },
                    "fullUrl": "urn:uuid:f6f2fd4a-0f5a-4cee-82a0-e6d08d64c2b4"
                  }
                ]
              },
              status: 200
            }
          }

          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set('X-Request-ID', requestId)
            .set('X-Correlation-ID', correlationId)
            .send(requestStr)
            .expect(statusCode)
        })
    })
  }
)
