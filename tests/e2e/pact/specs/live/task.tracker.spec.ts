import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"

test("task tracker e2e test", async () => {
  const createPactOptions = new CreatePactOptions("live", "task", "tracker")
  const provider = new Pact(pactOptions(createPactOptions))
  await provider.setup()
  const interaction = createInteraction(
    createPactOptions
  )
  interaction.withRequest.query = {
    "focus:identifier": "EB8B1F-A83008-42DC8L"
  }
  await provider.addInteraction(interaction)
  await provider.writePact()
})
