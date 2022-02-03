import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {checkMyPrescriptions, sendPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can send prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await sendPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
}
