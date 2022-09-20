import { driver } from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  checkMyPrescriptions
} from "../helpers"

import {
  loadNonASCIIDosageInstructionsFHIRMessage,
  loadNonASCIINoteToDispenseFHIRMessage,
  loadNonASCIIPatientAdditionalInstructionsFHIRMessage
} from "../test-packs/test-packs"



describe("firefox", () => {
  test("can dispense prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })


  test("can dispense prescription which has none ASCII chars in dosage Instructions ", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIIDosageInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })

  test("can dispense prescription which has none ASCII chars in note to dispense ", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIINoteToDispenseFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })


  test("can dispense prescription which has none ASCII chars in additional instructions", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })
})
