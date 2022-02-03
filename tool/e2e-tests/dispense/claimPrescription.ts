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

  const claimPageTitle = {xpath: "//*[text() = 'Claim for Dispensed Prescription']"}
  await driver.wait(until.elementsLocated(claimPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "CLAIM PRESCRIPTION SUCCESFUL")

  const claimButton = {xpath: "//*[text() = 'Claim']"}
  await driver.wait(until.elementsLocated(claimButton), defaultWaitTimeout)
  await driver.findElement(claimButton).click()
  await checkApiResult(driver)
}
