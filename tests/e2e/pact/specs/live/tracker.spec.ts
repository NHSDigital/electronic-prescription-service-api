import {
  createInteraction,
  CreatePactOptions,
  pactOptions,
  successfulOperationOutcome
} from "../../resources/common"
import {Pact} from "@pact-foundation/pact"
import {pino} from "pino"
import {fhir, fetcher} from "@models"
import * as TestResources from "../../resources/test-resources"
import {updatePrescriptions} from "../../services/update-prescriptions"
import {generateTestOutputFile} from "../../services/genereate-test-output-file"

const logger = pino()

const updateTestPrescriptions = async (): Promise<void> => {
  if (process.env.UPDATE_PRESCRIPTIONS !== "false") {
    await updatePrescriptions(
      fetcher.prescriptionOrderExamples.filter(e => e.isSuccess),
      [],
      [],
      [],
      [],
      [],
      logger
    )
  }
  generateTestOutputFile()
}

const sendTestPrescription = async (): Promise<string> => {
  const testCase = TestResources.processOrderCases[0]
  const caseDesc: string = testCase[0]
  const bundle: fhir.Bundle = testCase[1]

  const options = new CreatePactOptions("live", "process", "send")
  const provider = new Pact(pactOptions(options))
  await provider.setup()

  const firstMedicationRequest = bundle.entry.map(e => e.resource)
    .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
  const prescriptionId = firstMedicationRequest.groupIdentifier.value

  const interaction = createInteraction(
    options,
    bundle,
    successfulOperationOutcome,
    `a request to process prescription: ${prescriptionId} - ${caseDesc} message to Spine`
  )

  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()

  return prescriptionId
}

describe("prescription tracker e2e test", async () => {
  let prescriptionId: string

  beforeAll(async () => {
    updateTestPrescriptions()
    prescriptionId = await sendTestPrescription()
  })

  test("is able to retrieve prescription from Spine", async () => {
    const createPactOptions = new CreatePactOptions("live", "tracker")
    const provider = new Pact(pactOptions(createPactOptions))
    await provider.setup()
    const interaction = createInteraction(
      createPactOptions
    )
    interaction.withRequest.query = {
      "prescription_id": prescriptionId,
      "repeat_number": "1"
    }
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
