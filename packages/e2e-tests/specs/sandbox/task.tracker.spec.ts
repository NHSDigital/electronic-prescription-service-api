import {createInteraction, CreatePactOptions, pactOptions} from "../../resources/common"
import {PactV2} from "@pact-foundation/pact"

describe("task tracker e2e test", () => {
  test("should return 200", async () => {
    const options = new CreatePactOptions("sandbox", "task", "tracker")
    const provider = new PactV2(pactOptions(options))
    await provider.setup()
    const interaction = createInteraction(options)
    interaction.withRequest.query = {
      "focus:identifier": "EB8B1F-A83008-42DC8L"
    }
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
