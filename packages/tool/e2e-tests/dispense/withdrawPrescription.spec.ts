import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionWithFormUserJourney,
  getElement,
  waitForPageToRender
} from "../helpers"
import {withdrawButton, withdrawPageTitle, withdrawPrescriptionAction} from "../locators"

describe("firefox", () => {
  test("can withdraw prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionWithFormUserJourney(driver)
    await withdrawPrescriptionUserJourney(driver)
  })
})

async function withdrawPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await (await getElement(driver, withdrawPrescriptionAction)).click()
  await driver.wait(until.elementsLocated(withdrawPageTitle), defaultWaitTimeout)
  await waitForPageToRender()

  const withdrawReasonRadios = await driver.findElements(By.name("reason"))
  await withdrawReasonRadios[0].click()
  // wait 2 seconds for click to register
  await new Promise(r => setTimeout(r, 2000))
  await (await getElement(driver, withdrawButton)).click()
  // wait 2 seconds for click to register
  await new Promise(r => setTimeout(r, 2000))
  finaliseWebAction(driver, "WITHDRAWING PRESCRIPTION...")
  await checkApiResult(driver)
}
