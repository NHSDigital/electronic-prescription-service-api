import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {PactV3} from "@pact-foundation/pact"

test("prescription tracker e2e test", async () => {
  const options = new CreatePactOptions("live", "tracker")
  const provider = new PactV3(pactOptions(options))
  const interaction = createInteraction(options)
  interaction.withRequest.query = {
    "prescription_id": "EB8B1F-A83008-42DC8L",
    "repeat_number": "1"
  }
  await provider.addInteraction(interaction)
})
