import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {fetcher} from "@models"
import {PactV3} from "@pact-foundation/pact"

describe("validate e2e tests", () => {
  test("validate endpoint should return 200 on success", async () => {
    const testCase = fetcher.convertExamples[0]

    const options = new CreatePactOptions("sandbox", "validate")
    const provider = new PactV3(pactOptions(options))

    const interaction = createInteraction(
      options,
      testCase.request,
      successfulOperationOutcome)

    await provider.addInteraction(interaction)
  })
})
