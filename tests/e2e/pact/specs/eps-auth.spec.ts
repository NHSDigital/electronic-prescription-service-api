import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `${process.env.PACT_PROVIDER}+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const createInteraction = (desc: string, path: string): InteractionObject => {
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
      [`a request to convert a FHIR message`, '/$convert'],
      [`a request to prepare a message`, '/$prepare'],
      [`a request to process a message to Spine`, '/$process-message'],
    ]

    describe("endpoint authentication e2e tests", () => {
        test.each(testCases)('should reject unauthorised requests', async (desc: string, apiPath: string) => {
          const interaction: InteractionObject = createInteraction(desc, apiPath)
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .set('Authorization', `I am a bad access token`)
            .send({})
            .expect(401)
        })
    })
  })