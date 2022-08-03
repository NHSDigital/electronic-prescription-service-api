import {
  basePath,
  getHeaders,
  getStringParameterByName,
  pactOptions
} from "../../resources/common"
import {InteractionObject, Matchers} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {fhir} from "@models"

const provider = new Pact(pactOptions("live", "prepare"))

describe("prepare e2e tests", () => {
  test.each(TestResources.prepareCaseGroups)(
    "should be able to prepare a %s message",
    async (desc: string, request: fhir.Bundle, response: fhir.Parameters) => {
      provider.setup().then(async() => {
        const apiPath = `${basePath}/$prepare`
        const requestStr = LosslessJson.stringify(request)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
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
        await provider.writePact()
      })
    })
})