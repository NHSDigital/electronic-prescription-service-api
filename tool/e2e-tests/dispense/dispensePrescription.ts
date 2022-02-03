import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  createPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can dispense prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await releasePrescriptionUserJourney(driver)
  await dispensePrescriptionUserJourney(driver)
}
