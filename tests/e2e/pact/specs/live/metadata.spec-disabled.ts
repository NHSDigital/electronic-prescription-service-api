import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {Matchers} from "@pact-foundation/pact"
import {Pact} from "@pact-foundation/pact"

test("metadata e2e tests", async () => {
  const options = new CreatePactOptions("live", "metadata")
  const provider = new Pact(pactOptions(options))
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
          "extension": Matchers.eachLike(
            {
              "url": "implementationGuide",
              "extension": [
                {
                  "url": "name",
                  "valueString": Matchers.like("uk.nhsdigital.medicines.r4")
                }, {
                  "url": "version",
                  "valueString": Matchers.like("2.1.14-alpha")
                }
              ]
            }, {min: 1}
          )
        }
      ]
    }
  }
}
