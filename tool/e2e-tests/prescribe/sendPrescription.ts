import { driver } from "../live.test"
import { checkMyPrescriptions, sendPrescriptionUserJourney } from "../helpers"
import { loadNonASCIIDosageInstructionsFHIRMessage, loadNonASCIINoteToDispenseFHIRMessage, loadNonASCIIPatientAdditionalInstructionsFHIRMessage } from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })
})

describe('Can send perscriptions from FHIR message upload', () => {

  test("from Non-ASCII Dosage Instructions.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIDosageInstructionsFHIRMessage)
  })

  test("from Non-ASCII Note to dispenser.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIINoteToDispenseFHIRMessage)
  })

  test("from Non-ASCII Patient additional Instructions.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
  })
})
