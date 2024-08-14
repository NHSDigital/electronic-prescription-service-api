import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {Pact} from "@pact-foundation/pact"

describe("process-message claim sandbox e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("sandbox", "claim")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to process ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

describe("process-message claim amend sandbox e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("sandbox", "claim", "amend")
      const provider = new Pact(pactOptions(options))
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
    }
  )
})
