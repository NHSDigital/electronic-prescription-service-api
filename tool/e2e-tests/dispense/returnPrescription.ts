import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction
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
  await driver.findElement(By.linkText("Return prescription")).click()

  const returnPageTitle = {xpath: "//*[text() = 'Return prescription']"}
  await driver.wait(until.elementsLocated(returnPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "RETURN PRESCRIPTION SUCCESSFUL")

  const returnButton = {xpath: "//*[text() = 'Return']"}
  await driver.wait(until.elementsLocated(returnButton), defaultWaitTimeout)
  await driver.findElement(returnButton).click()
  await checkApiResult(driver)
}
