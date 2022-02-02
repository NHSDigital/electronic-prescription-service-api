import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {createPrescriptionUserJourney, releasePrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can release prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await releasePrescriptionUserJourney(driver)
}
