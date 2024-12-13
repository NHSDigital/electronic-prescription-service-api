import {CreatePactOptions, pactOptions} from "../../resources/common"
import {InteractionObject, Pact} from "@pact-foundation/pact"

test("prescribing metadata e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "metadata")
  const provider = new Pact(pactOptions(options))
  await provider.setup()

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
  await provider.addInteraction(interaction)

  await provider.writePact()
  await provider.finalize()
})
