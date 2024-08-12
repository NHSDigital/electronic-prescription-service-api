import {driver} from "../live.test"

import {sendPrescriptionUserJourney, cancelPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await cancelPrescriptionUserJourney(driver)
  })
})
