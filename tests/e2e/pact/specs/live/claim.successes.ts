import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"

const claimOptions = new CreatePactOptions("live", "claim")
const claimProvider = new Pact(pactOptions(claimOptions))

describe("claim e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim for %s",
    async (desc: string, message: fhir.Claim) => {
      claimProvider.setup().then(async() => {
        const interaction = createInteraction(
          claimOptions,
          message,
          successfulOperationOutcome,
          `a request to claim for prescription: ${desc} message to Spine`
        )
        await claimProvider.addInteraction(interaction)
        await claimProvider.writePact()
      })
    }
  )
})

const claimAmendOptions = new CreatePactOptions("live", "claim", "amend")
const claimAmendProvider = new Pact(pactOptions(claimAmendOptions))

describe("claim amend e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend for %s",
    async (desc: string, message: fhir.Claim) => {
      claimAmendProvider.setup().then(async() => {
        const interaction = createInteraction(
          claimOptions,
          message,
          successfulOperationOutcome,
          `a request to amend a claim for prescription: ${desc} message to Spine`,
        )
        await claimAmendProvider.addInteraction(interaction)
        await claimAmendProvider.writePact()
      })
    }
  )
})
