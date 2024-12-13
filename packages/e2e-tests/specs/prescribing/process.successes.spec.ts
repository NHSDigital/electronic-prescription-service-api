import {InteractionObject, Pact} from "@pact-foundation/pact"
import {CreatePactOptions, pactOptions} from "../../resources/common"
import {generateTestOutputFile} from "../../services/genereate-test-output-file"

beforeAll(async () => {
  await generateTestOutputFile()
})

test("prescribing process send success e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "process", "send")
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

test("prescribing process send cancel e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "process", "cancel")
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

test("prescribing process send dispense e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "process", "dispense")
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

test("prescribing process send dispenseamend e2e tests", async () => {

  const options = new CreatePactOptions("prescribing", "process", "dispenseamend")
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

  await provider.writePact()
  await provider.finalize()

})

test("prescribing process send e2e tests", async () => {
  const options = new CreatePactOptions("prescribing", "process", "send")
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

  await provider.writePact()
  await provider.finalize()
})
