import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "./all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  EPSAT_HOME_URL,
  finaliseWebAction,
  navigateToUrl,
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
  await performCancelPrescriptionUserJourney(driver, prescriptionId)
}

async function performCancelPrescriptionUserJourney(
  driver: ThenableWebDriver,
  prescriptionId: string
): Promise<void> {
  navigateToUrl(driver, `${EPSAT_HOME_URL}/prescribe/cancel?prescription_id=${prescriptionId}`)
  const medicationToCancelRadios = await driver.wait(until.elementsLocated(By.name("cancellationMedication")), 10000)
  medicationToCancelRadios[0].click()

  finaliseWebAction(driver, "CANCEL PRESCRIPTION SUCCESFUL")

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Cancel']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Cancel']"}).click()
  await checkApiResult(driver)
}
