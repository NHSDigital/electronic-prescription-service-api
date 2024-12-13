import {InteractionObject, Pact} from "@pact-foundation/pact"
import {createUnauthorisedInteraction} from "./auth"
import {basePath, CreatePactOptions, pactOptions} from "../../resources/common"

const authenticationTestDescription = "a request to prepare an unauthorised message"

describe("endpoint authentication e2e tests", () => {
  test(authenticationTestDescription, async () => {
    const options = new CreatePactOptions("proxygen", "prepare")
    const provider = new Pact(pactOptions(options))
    await provider.setup()
    const interaction: InteractionObject = createUnauthorisedInteraction(
      authenticationTestDescription,
      `${basePath}/$prepare`)
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
