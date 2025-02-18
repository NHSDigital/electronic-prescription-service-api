import {driver} from "../live.test"
import {checkMyPrescriptions, sendPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can send prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })
})
