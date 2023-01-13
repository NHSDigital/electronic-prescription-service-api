import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction
} from "../helpers"
import {returnButton, returnPageTitle} from "../locators"

describe("firefox", () => {
  test("can return prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await releasePrescriptionUserJourney(driver)
    await returnPrescriptionUserJourney(driver)
  })
})

async function returnPrescriptionUserJourney(driver: ThenableWebDriver) {
  await driver.findElement(By.linkText("Return prescription")).click()
  await driver.wait(until.elementsLocated(returnPageTitle), defaultWaitTimeout)
  await driver.wait(until.elementsLocated(returnButton), defaultWaitTimeout)
  await driver.findElement(returnButton).click()
  finaliseWebAction(driver, "RETURNING PRESCRIPTION...")
  await checkApiResult(driver)
}
