import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import * as TestResources from "../../resources/test-resources"
import { Bundle, Parameters } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import { createUnauthorisedInteraction } from "./eps-auth"
import supertest from "supertest"
import * as uuid from "uuid"
import {getStringParameterByName, pactOptions} from "../../resources/common"

jestpact.pactWith(
  pactOptions(false, "prepare"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    const authenticationTestDescription = "a request to prepare an unauthorised message"
    const requestId = uuid.v4().toString().toLowerCase()

    describe("endpoint authentication e2e tests", () => {
      test(authenticationTestDescription, async () => {
        const apiPath = "/$prepare"
        const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('X-Request-ID', requestId)
          .send({})
          .expect(401)
      })
    })

    describe("prepare e2e tests", () => {
      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)
        const requestId = uuid.v4()

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(inputMessageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": requestId
            },
            body: {
              resourceType: "Parameters",
              parameter: [
                {
                  name: "digest",
                  valueString: Matchers.like(getStringParameterByName(outputMessage, "digest").valueString)
                },
                {
                  name: "timestamp",
                  valueString: Matchers.like(getStringParameterByName(outputMessage, "timestamp").valueString)
                },
                {
                  name: "algorithm",
                  valueString: "RS1"
                }
              ]
            },
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
            .post(apiPath)
            .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
            .set('X-Request-ID', requestId)
            .send(inputMessageStr)
            .expect(200)
      })
    })
  }
)
