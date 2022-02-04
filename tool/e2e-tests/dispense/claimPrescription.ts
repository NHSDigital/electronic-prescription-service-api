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
import {claimButton, claimPageTitle} from "../locators"

describe("firefox", () => {
  test("can claim prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJounery(driver)
  })
})

async function claimPrescriptionUserJounery(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Claim for prescription")).click()
  await driver.wait(until.elementsLocated(claimPageTitle), defaultWaitTimeout)
  await driver.wait(until.elementsLocated(claimButton), defaultWaitTimeout)
  await driver.findElement(claimButton).click()
  finaliseWebAction(driver, "CLAIMING PRESCRIPTION...")
  await checkApiResult(driver)
}
