import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps-auth+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("convert e2e tests", () => {

        it('should reject unauthorised requests', async () => {
          const apiPath = "/$convert"
          const interaction: InteractionObject = {
            state: null,
            uponReceiving: `a request to convert a FHIR message`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "Authorization": "I am a bad access token"
              },
              method: "POST",
              path: "/$convert",
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
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .set('Authorization', `I am a bad access token`)
            .send({})
            .expect(401)
        })
    })

    describe("prepare e2e tests", () => {
      it('should reject unauthorised requests', async () => {
        const apiPath = "/$prepare"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare a message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": "I am a bad access token"
            },
            method: "POST",
            path: "/$prepare",
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
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('Authorization', 'I am a bad access token')
          .send({})
          .expect(401)
      })
    })

    describe("process-message e2e tests", () => {
      it('should reject unauthorised requests', async () => {
        const apiPath = "/$process-message"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process a message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Authorization": "I am a bad access token"
            },
            method: "POST",
            path: "/$process-message",
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
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('Authorization', 'I am a bad access token')
          .send({})
          .expect(401)
      })
    })
  }
)
