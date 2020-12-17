import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import * as TestResources from "../../resources/test-resources"
import { Bundle, Parameters } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "merge"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    describe("prepare e2e tests", () => {

      const prepareCasesSubset = TestResources.prepareCases.splice(0, 5)

      test.each(prepareCasesSubset)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)

        const interaction: InteractionObject = {
          state: "",
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(inputMessageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: outputMessage,
            status: 200
          }
        }
        await provider.addInteraction(interaction)
      })
    })
  }
)