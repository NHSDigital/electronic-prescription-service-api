import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {MatchersV2, PactV2} from "@pact-foundation/pact"

test("metadata e2e tests", async () => {
  const options = new CreatePactOptions("sandbox", "metadata")
  const provider = new PactV2(pactOptions(options))
  await provider.setup()

  const interaction = createInteraction(
    options,
    null,
    getResponseExpectation()
  )
  interaction.willRespondWith.headers = {
    ...interaction.willRespondWith.headers,
    "Content-Type": "application/json; charset=utf-8"
  }

  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()
})

function getResponseExpectation() {
  return {
    "capabilityStatement": {
      "resourceType": "CapabilityStatement",
      "extension": [
        {
          "url": "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition",
          "extension":  MatchersV2.eachLike(
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
