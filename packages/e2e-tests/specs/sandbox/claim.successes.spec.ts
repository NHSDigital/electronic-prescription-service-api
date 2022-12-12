import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {PactV3} from "@pact-foundation/pact"

describe("process-message claim sandbox e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("sandbox", "claim")
      const provider = new PactV3(pactOptions(options))

      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to process ${desc} message to Spine`
      )

      await provider.addInteraction(interaction)

    }
  )
})

describe("process-message claim amend sandbox e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend %s",
    async (desc: string, message: fhir.Claim) => {
      const options = new CreatePactOptions("sandbox", "claim", "amend")
      const provider = new PactV3(pactOptions(options))
      const interaction = createInteraction(
        options,
        message,
        successfulOperationOutcome,
        `a request to amend a claim for prescription: ${desc} message to Spine`,
      )
      await provider.addInteraction(interaction)

    }
  )
})
