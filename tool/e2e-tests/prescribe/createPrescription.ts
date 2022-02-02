import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "./all.test"
import {performCreatePrescriptionUserJourney} from "./helpers"

describe("firefox", () => {
  test("can create prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await performCreatePrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
}
