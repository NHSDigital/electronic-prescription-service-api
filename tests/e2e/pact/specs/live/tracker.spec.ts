import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"

test("prescription tracker e2e test", async () => {
  const createPactOptions = new CreatePactOptions("live", "tracker")
  const provider = new Pact(pactOptions(createPactOptions))
  await provider.setup()
  const interaction = createInteraction(
    createPactOptions
  )
  interaction.withRequest.query = {
    "prescription_id": "EB8B1F-A83008-42DC8L",
    "repeat_number": "1"
  }
  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()
})
