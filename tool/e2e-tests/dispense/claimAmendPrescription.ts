import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney,
  releasePrescriptionUserJourney,
  dispensePrescriptionUserJourney,
  checkMyPrescriptions,
  claimPrescriptionUserJourney
} from "../helpers"
import {claimButton, claimPageTitle} from "../locators"

describe("firefox", () => {
  test("can claim prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await releasePrescriptionUserJourney(driver)
    await dispensePrescriptionUserJourney(driver)
    await claimPrescriptionUserJourney(driver)
    await claimAmendPrescriptionUserJourney(driver)
    await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
  })
})

async function claimAmendPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Amend a claim on this prescription")).click()
  await driver.wait(until.elementsLocated(claimPageTitle), defaultWaitTimeout)
  await driver.wait(until.elementsLocated(claimButton), defaultWaitTimeout)
  await driver.findElement(claimButton).click()
  finaliseWebAction(driver, "AMENDING CLAIM FOR PRESCRIPTION...")
  await checkApiResult(driver)
}
