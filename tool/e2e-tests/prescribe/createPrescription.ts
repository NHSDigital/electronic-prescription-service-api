import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {createPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can create prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
}
