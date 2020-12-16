import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("prepare e2e tests", () => {
      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(inputMessageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: outputMessage,
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(inputMessageStr)
          .expect(200)
      })
    })

    describe("process-message e2e tests", () => {
      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as Bundle

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$process-message",
            body: bundle
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
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
          .send(bundleStr)
          .expect(400)
      })
    })

    const createUnauthorisedInteraction = (desc: string, path: string): InteractionObject => {
      return {
        state: null,
        uponReceiving: desc,
        withRequest: {
          headers: {
            "Content-Type": "application/fhir+json; fhirVersion=4.0",
            "Authorization": "I am a bad access token"
          },
          method: "POST",
          path: path,
          body: {}
        },
        willRespondWith: {
          headers: {
            "Content-Type": "application/json"
          },
          body: {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "forbidden",
                details: {
                  coding: [
                    {
                      system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                      version: "1",
                      code: "ACCESS_DENIED",
                      display: "Invalid access token"
                    }
                  ]
                }
              }
            ]
          },
          status: 401
        }
      }
    }

    const testCases = [
      [`a request to convert an unauthorised message`, '/$convert'],
      [`a request to prepare an unauthorised message`, '/$prepare'],
      [`a request to process an unauthorised message`, '/$process-message'],
    ]

    describe("endpoint authentication e2e tests", () => {
        test.each(testCases)('should reject unauthorised requests', async (desc: string, apiPath: string) => {
          await provider.addInteraction(createUnauthorisedInteraction(desc, apiPath))
          await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .set('Authorization', `I am a bad access token`)
            .send({})
            .expect(401)
        })
    })
  }
)
