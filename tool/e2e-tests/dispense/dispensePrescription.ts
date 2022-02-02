import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  createPrescriptionUserJourney,
  releasePrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can dispense prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await releasePrescriptionUserJourney(driver)
  await dispensePrescriptionUserJourney(driver)
}

async function dispensePrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Dispense prescription")).click()

  const dispensePageTitle = {xpath: "//*[text() = 'Dispense Prescription']"}
  await driver.wait(until.elementsLocated(dispensePageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "DISPENSE PRESCRIPTION SUCCESFUL")

  const dispenseButton = {xpath: "//*[text() = 'Dispense']"}
  await driver.wait(until.elementsLocated(dispenseButton), defaultWaitTimeout)
  await driver.findElement(dispenseButton).click()
  await checkApiResult(driver)
}
