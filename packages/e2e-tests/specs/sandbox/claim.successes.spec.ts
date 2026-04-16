import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {PactV2} from "@pact-foundation/pact"

describe("process-message claim sandbox e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim $description",
    async ({description, request}: {description: string, request: fhir.Claim}) => {
      const options = new CreatePactOptions("sandbox", "claim")
      const provider = new PactV2(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        request,
        successfulOperationOutcome,
        `a request to process ${description} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message claim amend sandbox e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend $description",
    async ({description, request}: {description: string, request: fhir.Claim}) => {
      const options = new CreatePactOptions("sandbox", "claim", "amend")
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
    }
  )
})
