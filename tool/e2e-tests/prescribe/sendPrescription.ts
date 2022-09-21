import {driver} from "../live.test"
import {checkMyPrescriptions, sendPrescriptionUserJourney} from "../helpers"
import {
  loadNonASCIIDosageInstructionsFHIRMessage,
  loadNonASCIINoteToDispenseFHIRMessage,
  loadNonASCIIPatientAdditionalInstructionsFHIRMessage,
  loadXMLTagPatientAdditionalInstructionsFHIRMessage,
  loadXMLTagDosageInstructionsFHIRMessage,
  loadXMLTagNotesToDispenseFHIRMessage
} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })
})

describe("Can send perscriptions from FHIR message upload", () => {

  test("from non-ASCII Dosage Instructions.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIDosageInstructionsFHIRMessage)
  })

  test("from non-ASCII Note to dispenser.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIINoteToDispenseFHIRMessage)
  })

  test("from non-ASCII Patient additional Instructions.json", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
  })

  test("when Patient additional Instructions contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagPatientAdditionalInstructionsFHIRMessage)
  })

  test("when Dosage Instructions contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagDosageInstructionsFHIRMessage)
  })

  test("when Note to dispenser contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagNotesToDispenseFHIRMessage)
  })


})
