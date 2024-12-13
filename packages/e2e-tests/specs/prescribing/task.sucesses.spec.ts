import {InteractionObject, Pact} from "@pact-foundation/pact"
import {CreatePactOptions, pactOptions} from "../../resources/common"

test("prescribing task release e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "task", "release")
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

test("prescribing task return e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "task", "return")
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

test("prescribing task withdraw e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "task", "withdraw")
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
