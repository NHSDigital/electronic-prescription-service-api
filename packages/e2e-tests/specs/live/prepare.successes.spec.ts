import {
  createInteraction,
  CreatePactOptions,
  getStringParameterByName,
  pactOptions
} from "../../resources/common"
import {MatchersV2} from "@pact-foundation/pact"
import {PactV2} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

describe("prepare e2e tests", () => {
  test.each(TestResources.prepareCaseGroups)(
    "should be able to prepare a %s message",
    async (desc: string, request: fhir.Bundle, response: fhir.Parameters) => {
      const options = new CreatePactOptions("live", "prepare")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        getResponseExpectation(response),
        `a request to prepare ${desc} message`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
})

function getResponseExpectation(response: fhir.Parameters) {
  return {
    resourceType: "Parameters",
    parameter: [
      {
        name: "digest",
        valueString: MatchersV2.like(getStringParameterByName(response, "digest").valueString)
      },
      {
        name: "timestamp",
        valueString: MatchersV2.like(getStringParameterByName(response, "timestamp").valueString)
      },
      {
        name: "algorithm",
        valueString: MatchersV2.like(getStringParameterByName(response, "algorithm").valueString)
      }
    ]
  }
}
