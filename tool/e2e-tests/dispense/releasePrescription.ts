import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  checkMyPrescriptions
} from "../helpers"
import * as testPacks from "../test-packs/test-packs"

describe("firefox", () => {
  test("can release prescription", async () => {

    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release prescription which has non-ASCII chars in dosage Instructions", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadNonASCIIDosageInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release prescription which has non-ASCII chars in note to dispense", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadNonASCIINoteToDispenseFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release prescription which has non-ASCII chars in additional instructions", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release Patient additional Instructions contains XML tag", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadXMLTagPatientAdditionalInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release Dosage Instructions contains XML tag", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadXMLTagDosageInstructionsFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })

  test("can release Note to dispenser contains XML tag", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, testPacks.loadXMLTagNotesToDispenseFHIRMessage)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })
})
