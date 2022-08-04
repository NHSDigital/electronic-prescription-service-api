import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import {fetcher} from "@models"

test("validate e2e tests", async () => {
  const testCase = fetcher.convertExamples[0]

  const options = new CreatePactOptions("live", "validate")
  const provider = new Pact(pactOptions(options))
  await provider.setup()

  const interaction = createInteraction(
    options,
    testCase.request,
    successfulOperationOutcome)

  await provider.addInteraction(interaction)
  await provider.writePact()
})
