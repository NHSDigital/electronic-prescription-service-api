import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionWithFormUserJourney,
  checkMyPrescriptions,
  claimPrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can claim prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionWithFormUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })

})
