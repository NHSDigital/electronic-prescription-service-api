import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can withdraw prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await withdrawPrescriptionUserJourney(driver)
  })
})

async function withdrawPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Withdraw prescription")).click()

  const withdrawPageTitle = {xpath: "//*[text() = 'Withdraw prescription']"}
  await driver.wait(until.elementsLocated(withdrawPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "WITHDRAW PRESCRIPTION SUCCESSFUL")

  const withdrawButton = {xpath: "//*[text() = 'Withdraw']"}
  await driver.wait(until.elementsLocated(withdrawButton), defaultWaitTimeout)
  await driver.findElement(withdrawButton).click()
  await checkApiResult(driver)
}
