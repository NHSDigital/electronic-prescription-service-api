import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney,
  twoTimesDefaultWaitTimeout
} from "../helpers"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await cancelPrescriptionUserJourney(driver)
  })
})

async function cancelPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Cancel prescription")).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel Prescription']"}), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.wait(until.elementsLocated(By.name("cancellationMedication")), twoTimesDefaultWaitTimeout)
  medicationToCancelRadios[0].click()
  finaliseWebAction(driver, "CANCEL PRESCRIPTION SUCCESFUL")

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Cancel']"}).click()
  await checkApiResult(driver)
}
