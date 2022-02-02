import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  createPrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await cancelPrescriptionUserJourney(driver)
}

async function cancelPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Cancel prescription")).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel Prescription']"}), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.wait(until.elementsLocated(By.name("cancellationMedication")), 10000)
  medicationToCancelRadios[0].click()
  finaliseWebAction(driver, "CANCEL PRESCRIPTION SUCCESFUL")

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Cancel']"}).click()
  await checkApiResult(driver)
}
