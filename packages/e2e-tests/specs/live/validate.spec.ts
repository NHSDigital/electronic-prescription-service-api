import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {InteractionObject, Pact} from "@pact-foundation/pact"
import {fetcher} from "@models"

test("validate e2e tests", async () => {
  const testCase = fetcher.convertExamples[0]

  const options = new CreatePactOptions("live", "validate")
  const provider = new Pact(pactOptions(options))
  await provider.setup()

  const interaction = getInteraction(
    process.env["API_DEPLOYMENT_METHOD"],
    options,
    testCase.request
  )

  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()
})

function getInteraction(apiDeploymentMethod, options, request) {
  switch(apiDeploymentMethod) {
    case "apim": {
      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome)
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
