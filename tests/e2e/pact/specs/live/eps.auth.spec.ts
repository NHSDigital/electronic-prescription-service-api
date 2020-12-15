import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"

const createUnauthorisedInteraction = (desc: string, path: string): InteractionObject => {
  return {
    state: "is not authenticated",
    uponReceiving: desc,
    withRequest: {
      headers: {
        "Content-Type": "application/fhir+json; fhirVersion=4.0"
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

const authTestCases = [
  [`a request to convert an unauthorised message`, '/$convert'],
  [`a request to prepare an unauthorised message`, '/$prepare'],
  [`a request to process an unauthorised message`, '/$process-message'],
]

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
    describe("endpoint authentication e2e tests", () => {
        test.each(authTestCases)('should reject unauthorised requests', async (desc: string, apiPath: string) => {
          const interaction: InteractionObject = createUnauthorisedInteraction(desc, apiPath)
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .send({})
            .expect(401)
        })
    })
  }
)