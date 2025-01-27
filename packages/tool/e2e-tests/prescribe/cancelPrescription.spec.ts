import {driver} from "../live.test"

import {sendPrescriptionUserJourney, cancelPrescriptionUserJourney} from "../helpers"

describe("chrome", () => {
  test("can cancel prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await cancelPrescriptionUserJourney(driver)
  })
})
