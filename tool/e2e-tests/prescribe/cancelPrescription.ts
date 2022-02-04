import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney
} from "../helpers"
import {cancelButton, cancelPrescriptionAction, cancelPrescriptionPageTitle} from "../locators"

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
  await driver.findElement(cancelPrescriptionAction).click()
  await driver.wait(until.elementsLocated(cancelPrescriptionPageTitle), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.findElements(By.name("cancellationMedication"))
  const firstMedicationToCancelRadio = medicationToCancelRadios[0]
  firstMedicationToCancelRadio.click()
  await driver.findElement(cancelButton).click()
  finaliseWebAction(driver, "CANCELLING PRESCRIPTION...")
  await checkApiResult(driver)
}
