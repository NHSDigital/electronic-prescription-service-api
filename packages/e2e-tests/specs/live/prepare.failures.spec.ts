import {V3Interaction, PactV3} from "@pact-foundation/pact"
import {createUnauthorisedInteraction} from "./auth"
import {basePath, CreatePactOptions, pactOptions} from "../../resources/common"

const authenticationTestDescription = "a request to prepare an unauthorised message"

describe("endpoint authentication e2e tests", () => {
  test(authenticationTestDescription, async () => {
    const options = new CreatePactOptions("live", "prepare")
    const provider = new PactV3(pactOptions(options))

    const interaction: V3Interaction = createUnauthorisedInteraction(
      authenticationTestDescription,
      `${basePath}/$prepare`)
    await provider.addInteraction(interaction)
  })
})
