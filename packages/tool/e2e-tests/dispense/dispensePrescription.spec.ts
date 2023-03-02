import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionWithFormUserJourney,
  dispensePrescriptionWithBodyUserJourney,
  checkMyPrescriptions
} from "../helpers"

describe("firefox", () => {
  test("can dispense prescription using form", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionWithFormUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })
  test("can dispense prescription using custom message", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionWithBodyUserJourney(driver, prescriptionId)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })

})
