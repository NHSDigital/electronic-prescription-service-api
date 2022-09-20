import { driver } from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  checkMyPrescriptions,
  claimPrescriptionUserJourney
} from "../helpers"
import {
  loadNonASCIIDosageInstructionsFHIRMessage,
  loadNonASCIINoteToDispenseFHIRMessage,
  loadNonASCIIPatientAdditionalInstructionsFHIRMessage
} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can claim prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })

  test("can claim prescription which has none ASCII chars in dosage Instructions ", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIIDosageInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })

  test("can claim prescription which has none ASCII chars in note to dispense ", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIINoteToDispenseFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })


  test("can claim prescription which has none ASCII chars in additional instructions", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })
})
