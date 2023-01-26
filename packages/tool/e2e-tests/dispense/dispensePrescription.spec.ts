import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  checkMyPrescriptions
} from "../helpers"

describe("firefox", () => {
  test("can dispense prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Dispensed Prescriptions", prescriptionId)
  })

})
