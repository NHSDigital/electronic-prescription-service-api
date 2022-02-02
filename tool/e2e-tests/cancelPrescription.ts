import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "./all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  performCreatePrescriptionUserJourney
} from "./helpers"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await performCreatePrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await performCancelPrescriptionUserJourney(driver)
}

async function performCancelPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Cancel medication")).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel Medication']"}), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.wait(until.elementsLocated(By.name("cancellationMedication")), 10000)
  medicationToCancelRadios[0].click()
  finaliseWebAction(driver, "CANCEL PRESCRIPTION SUCCESFUL")

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Cancel']"}).click()
  await checkApiResult(driver)
}
