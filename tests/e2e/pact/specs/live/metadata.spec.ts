import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {Matchers} from "@pact-foundation/pact"
import {Pact} from "@pact-foundation/pact"

const createPactOptions = new CreatePactOptions("live", "metadata")
const provider = new Pact(pactOptions(createPactOptions))

beforeAll(async() => {
  await provider.setup()
})

afterAll(async() => {
  await provider.writePact()
  await provider.finalize()
})

test("metadata e2e tests", async () => {
  const interaction = createInteraction(
    createPactOptions,
    null,
    getResponse()
  )
  await provider.addInteraction(interaction)
})

function getResponse() {
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
