import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  createPrescriptionUserJourney
} from "../helpers"

describe("firefox", () => {
  test("can release prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await createPrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  await releasePrescriptionUserJourney(driver)
}

async function releasePrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Release prescription")).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Release prescription(s)']"}), defaultWaitTimeout)
  const pharmacyToReleaseToRadios = await driver.wait(until.elementsLocated(By.name("pharmacy")), 10000)
  pharmacyToReleaseToRadios[0].click()
  finaliseWebAction(driver, "RELEASE PRESCRIPTION SUCCESFUL")

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Release']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Release']"}).click()
  await checkApiResult(driver)
}
