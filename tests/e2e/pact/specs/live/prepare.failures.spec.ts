import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import { createUnauthorisedInteraction } from "./auth"
import * as uuid from "uuid"
import { basePath, pactOptions } from "../../resources/common"

jestpact.pactWith(
  pactOptions("live", "prepare", "failures"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const authenticationTestDescription = "a request to prepare an unauthorised message"

    describe("endpoint authentication e2e tests", () => {
      test(authenticationTestDescription, async () => {
        const apiPath = `${basePath}/$prepare`
        const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
        const requestId = uuid.v4()
        const correlationId = uuid.v4()
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .send({})
          .expect(401)
      })
    })
  })