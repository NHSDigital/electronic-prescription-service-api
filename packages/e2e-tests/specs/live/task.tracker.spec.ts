import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {InteractionObject, Pact} from "@pact-foundation/pact"

test("task tracker e2e test", async () => {
  const options = new CreatePactOptions("live", "task", "tracker")
  const provider = new Pact(pactOptions(options))
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
        options
      )
      interaction.withRequest.query = {
        "focus:identifier": "EB8B1F-A83008-42DC8L"
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
