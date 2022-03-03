import {driver} from "../all.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  amendDispenseUserJourney,
  checkMyPrescriptions
} from "../helpers"
import {searchForPrescriptionUserJourney} from "../tracker/searchPrescription"

describe("firefox", () => {
  test("can amend a dispense", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await searchForPrescriptionUserJourney(driver, prescriptionId)
    await amendDispenseUserJourney(driver)
  })
})
