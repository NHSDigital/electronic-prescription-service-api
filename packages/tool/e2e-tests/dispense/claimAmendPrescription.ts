import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  checkMyPrescriptions,
  claimPrescriptionUserJourney,
  claimAmendPrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can amend a claim on a prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await claimAmendPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })
})
