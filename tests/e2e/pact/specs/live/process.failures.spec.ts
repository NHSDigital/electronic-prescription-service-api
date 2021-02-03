import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import { pactOptions } from "../../resources/common"
import { createUnauthorisedInteraction } from "./auth"

jestpact.pactWith(
  pactOptions("live", "process", ["failures"]),
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