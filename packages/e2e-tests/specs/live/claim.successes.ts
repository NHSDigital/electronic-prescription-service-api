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
    "should be able to claim for $description",
    async ({description, request}: {description: string, request: fhir.Claim}) => {
      const options = new CreatePactOptions("live", "claim")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to claim for prescription: ${description} message to Spine`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)

describe("claim amend e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend for $description",
    async ({description, request}: {description: string, request: fhir.Claim}) => {
      const options = new CreatePactOptions("live", "claim", "amend")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()
      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to amend a claim for prescription: ${description} message to Spine`
      )
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    })
}
)
