import {driver} from "../live.test"

import {
  sendPrescriptionUserJourney,
  cancelPrescriptionUserJourney,
  logout,
  loginViaSimulatedAuthSmartcardUser
} from "../helpers"
import { searchForPrescriptionUserJourney } from "../tracker/searchPrescription.spec"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel a prescription created by another EPSAT session", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await logout(driver)

    await loginViaSimulatedAuthSmartcardUser(driver)
    await searchForPrescriptionUserJourney(driver, prescriptionId)
    await cancelPrescriptionUserJourney(driver)
  })
})
