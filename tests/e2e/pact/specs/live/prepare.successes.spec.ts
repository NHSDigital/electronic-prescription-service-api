import { InteractionObject, Matchers } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import * as TestResources from "../../resources/test-resources"
import { Bundle, Parameters } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import supertest from "supertest"
import * as uuid from "uuid"
import { basePath, getStringParameterByName, pactOptions } from "../../resources/common"

const preparePactGroups = [
  {
    name: "secondarycare-community-acute",
    cases: TestResources.prepareSecondaryCareCommunityAcuteCases
  },
  {
    name: "secondarycare-community-repeatdispensing",
    cases: TestResources.prepareSecondaryCareCommunityRepeatDispensingCases
  },
  {
    name: "secondarycare-homecare",
    cases: TestResources.prepareSecondaryCareHomecareCases
  },
  {
    name: "primarycare",
    cases: TestResources.preparePrimaryCareCases
  }
]

preparePactGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("live", "prepare", [pactGroupName]),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("prepare e2e tests", () => {
        test.each(pactGroupTestCases)("should be able to prepare a %s message", async (desc: string, request: Bundle, response: Parameters) => {
          const apiPath = `${basePath}/$prepare`
          const requestStr = LosslessJson.stringify(request)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to prepare ${desc} message`,
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
                resourceType: "Parameters",
                parameter: [
                  {
                    name: "digest",
                    valueString: Matchers.like(getStringParameterByName(response, "digest").valueString)
                  },
                  {
                    name: "timestamp",
                    valueString: Matchers.like(getStringParameterByName(response, "timestamp").valueString)
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
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(requestStr)
            .expect(200)
        })
      })
    }
  )
})
