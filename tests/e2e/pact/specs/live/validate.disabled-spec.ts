import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import {fetcher} from "@models"

const createPactOptions = new CreatePactOptions("live", "validate")
const provider = new Pact(pactOptions(createPactOptions))

test("validate e2e tests", async () => {
  provider.setup().then(async () => {
    const testCase = fetcher.convertExamples[0]
    const interaction = createInteraction(
      createPactOptions,
      testCase.request,
      successfulOperationOutcome)
    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})
