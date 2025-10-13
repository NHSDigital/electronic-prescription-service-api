import {InteractionObject, PactV2} from "@pact-foundation/pact"
import {createUnauthorisedInteraction} from "./auth"
import {basePath, CreatePactOptions, pactOptions} from "../../resources/common"

const authenticationTestDescription = "a request to prepare an unauthorised message"

describe("endpoint authentication e2e tests", () => {
  test(authenticationTestDescription, async () => {
    const options = new CreatePactOptions("live", "prepare")
    const provider = new PactV2(pactOptions(options))
    await provider.setup()
    const interaction: InteractionObject = createUnauthorisedInteraction(
      authenticationTestDescription,
      `${basePath}/$prepare`)
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
