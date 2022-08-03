import {getHeaders, pactOptions} from "../../resources/common"
import {InteractionObject, Matchers} from "@pact-foundation/pact"
import {Pact} from "@pact-foundation/pact"

const provider = new Pact(pactOptions("live", "metadata"))

test("metadata e2e tests", async () => {
  provider.setup().then(async() => {
    const apiPath = `/metadata`

    const responseBody = {
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

    const interaction: InteractionObject = {
      state: "is authenticated",
      uponReceiving: "a valid FHIR message",
      withRequest: {
        headers: getHeaders(),
        method: "GET",
        path: apiPath
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0"
        },
        body: responseBody,
        status: 200
      }
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})
