import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {PactV2} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

describe("claim e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim for %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("live", "claim")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to claim for prescription: ${desc} message to Spine`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)

describe("claim amend e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend for %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("live", "claim", "amend")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to amend a claim for prescription: ${desc} message to Spine`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)
