import {By, Key, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {checkFhirApiResult, defaultWaitTimeout, EPSAT_HOME_URL, navigateToUrl, sendPrescriptionUserJourney, threeTimesDefaultWaitTimeout} from "../helpers"

describe("firefox", () => {
  test("can validate a fhir resource", async () => {
    await sendPrescriptionUserJourney(driver)
    const fhirRequestExpander = await (await driver.findElements({xpath: "//details"}))[0]
    await fhirRequestExpander.click()
    const copyFhirRequestButtonLocator = {xpath: "//*[text() = 'Copy']"}
    const copyFhirRequestButton = driver.findElement(copyFhirRequestButtonLocator)
    await driver.wait(until.elementIsVisible(copyFhirRequestButton), defaultWaitTimeout)
    await copyFhirRequestButton.click()
    await navigateToUrl(driver, `${EPSAT_HOME_URL}/`)
    await validateFhirResourceUserJourney(driver)
  })
})

async function validateFhirResourceUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.wait(until.elementLocated(By.linkText("Validate a FHIR Resource")), threeTimesDefaultWaitTimeout)
  await driver.findElement(By.linkText("Validate a FHIR Resource")).click()
  console.log("VALIDATE FHIR RESOURCE SUCCESSFUL")
  await driver.findElement(By.id("validatePayload")).sendKeys(Key.CONTROL, "v")
  await driver.findElement({xpath: "//*[text() = 'Validate']"}).click()
  await checkFhirApiResult(driver)
}
