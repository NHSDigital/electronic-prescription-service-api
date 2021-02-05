import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {createUnauthorisedInteraction} from "./eps-auth"
import * as uuid from "uuid"
import {pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions(false, "process"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const authenticationTestDescription = "a request to process an unauthorised message"

    describe("endpoint authentication e2e tests", () => {
      test(authenticationTestDescription, async () => {
        const apiPath = "/$process-message"
        const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()
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

    describe("process-message e2e tests", () => {
      test.each(TestResources.processCases)("should be able to process a %s message", async (desc: string, request: Bundle) => {
        const apiPath = "/$process-message"
        const requestStr = LosslessJson.stringify(request)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to process ${desc} message to Spine`,
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
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: "invalid",
                  severity: "error",
                  details: {
                    coding: [
                      {
                        code: "202",
                        display: "Duplicate HL7 ID Error"
                      }
                    ]
                  }
                }
              ]
            },
            status: 400
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('X-Request-ID', requestId)
          .set('X-Correlation-ID', correlationId)
          .send(requestStr)
          .expect(400)
      })
    })
  }
)
