import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {InteractionObject, MatchersV2} from "@pact-foundation/pact"
import {PactV2} from "@pact-foundation/pact"

test("metadata e2e tests", async () => {
  const options = new CreatePactOptions("live", "metadata")
  const provider = new PactV2(pactOptions(options))
  await provider.setup()

  const interaction = getInteraction(process.env["API_DEPLOYMENT_METHOD"], options)

  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()
})

function getInteraction(apiDeploymentMethod, options) {
  switch(apiDeploymentMethod) {
    case "apim": {
      const interaction = createInteraction(
        options,
        null,
        getResponseExpectation()
      )
      interaction.willRespondWith.headers = {
        ...interaction.willRespondWith.headers,
        "Content-Type": "application/json; charset=utf-8"
      }
      return interaction
    }
    case "proxygen": {
      const interaction: InteractionObject = {
        state: null,
        uponReceiving: "a valid response",
        withRequest: {
          method: "GET",
          path: "/_ping"
        },
        willRespondWith: {
          status: 200
        }
      }
      return interaction
    }
    default: {
      throw new Error("Unknown api deployment method")
    }

  }
}

function getResponseExpectation() {
  return {
    "capabilityStatement": {
      "resourceType": "CapabilityStatement",
      "extension": [
        {
          "url": "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition",
          "extension": MatchersV2.eachLike(
            {
              "url": "implementationGuide",
              "extension": [
                {
                  "url": "name",
                  "valueString": MatchersV2.like("uk.nhsdigital.medicines.r4")
                }, {
                  "url": "version",
                  "valueString": MatchersV2.like("2.1.14-alpha")
                }
              ]
            }, {min: 1}
          )
        }
      ]
    }
  }
}
