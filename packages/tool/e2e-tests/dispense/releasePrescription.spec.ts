import {driver} from "../live.test"
import {sendPrescriptionUserJourney, releasePrescriptionUserJourney, checkMyPrescriptions} from "../helpers"

describe("chrome", () => {
  test("can release prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Released Prescriptions", prescriptionId)
  })
})
