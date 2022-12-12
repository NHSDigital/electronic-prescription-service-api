import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {PactV3} from "@pact-foundation/pact"
import {fetcher} from "@models"

test("validate e2e tests", async () => {
  const testCase = fetcher.convertExamples[0]

  const options = new CreatePactOptions("live", "validate")
  const provider = new PactV3(pactOptions(options))

  const interaction = createInteraction(
    options,
    testCase.request,
    successfulOperationOutcome)

  await provider.addInteraction(interaction)
})
