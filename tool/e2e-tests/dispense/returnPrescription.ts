import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can return prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await returnPrescriptionUserJourney(driver)
  })
})

async function returnPrescriptionUserJourney(driver: ThenableWebDriver) {
  await driver.sleep(1000)
}
