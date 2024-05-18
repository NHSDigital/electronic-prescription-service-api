import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionWithFormUserJourney,
  getElement
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
  (await getElement(driver, withdrawPrescriptionAction)).click();
  await driver.wait(until.elementsLocated(withdrawPageTitle), defaultWaitTimeout)
  const withdrawReasonRadios = await driver.findElements(By.name("reason"))
  withdrawReasonRadios[0].click();
  (await getElement(driver, withdrawButton)).click();
  finaliseWebAction(driver, "WITHDRAWING PRESCRIPTION...")
  await checkApiResult(driver)
}
