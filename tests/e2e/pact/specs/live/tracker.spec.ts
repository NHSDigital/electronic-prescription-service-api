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

const getTestCase = () => {
  const testCase = TestResources.processOrderCases[0]
  return {
    caseDesc: testCase[0],
    bundle: testCase[1]
  }
}

const getPrescriptionShortFormId = (bundle: fhir.Bundle) => {
  const firstMedicationRequest = bundle.entry.map(e => e.resource)
    .find(r => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
  return firstMedicationRequest.groupIdentifier.value
}

describe("prescription tracker e2e test", async () => {

  beforeAll(async () => {
    updateTestPrescriptions()
  })

  test("is able to create a test prescription", async () => {
    const options = new CreatePactOptions("live", "process", "send")
    const provider = new Pact(pactOptions(options))
    await provider.setup()

    const {caseDesc, bundle} = getTestCase()
    const prescriptionId = getPrescriptionShortFormId(bundle)

    const interaction = createInteraction(
      options,
      bundle,
      successfulOperationOutcome,
      `a request to process prescription: ${prescriptionId} - ${caseDesc} message to Spine`
    )

    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })

  test("is able to retrieve the test prescription from Spine", async () => {
    const createPactOptions = new CreatePactOptions("live", "tracker")
    const provider = new Pact(pactOptions(createPactOptions))
    await provider.setup()
    const interaction = createInteraction(
      createPactOptions
    )

    const {bundle} = getTestCase()
    const prescriptionId = getPrescriptionShortFormId(bundle)

    interaction.withRequest.query = {
      "prescription_id": prescriptionId,
      "repeat_number": "1"
    }
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})
