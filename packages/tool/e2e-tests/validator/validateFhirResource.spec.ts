import {By, Key, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {checkApiResult, defaultWaitTimeout, EPSAT_HOME_URL, finaliseWebAction, navigateToUrl, sendPrescriptionUserJourney, threeTimesDefaultWaitTimeout} from "../helpers"
import {copyFhirRequestButton, fhirRequestExpander} from "../locators"

describe("firefox", () => {
  test("can validate a fhir resource", async () => {
    await sendPrescriptionUserJourney(driver)
    const fhirRequestExpanderElement = await driver.findElement(fhirRequestExpander)
    await fhirRequestExpanderElement.click()
    const copyFhirRequestButtonElement = driver.findElement(copyFhirRequestButton)
    await driver.wait(until.elementIsVisible(copyFhirRequestButtonElement), defaultWaitTimeout)
    await copyFhirRequestButtonElement.click()
    await navigateToUrl(driver, `${EPSAT_HOME_URL}/`)
    await validateFhirResourceUserJourney(driver)
  })
})

async function validateFhirResourceUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.wait(until.elementLocated(By.linkText("Validate a FHIR Resource")), threeTimesDefaultWaitTimeout)
  await driver.findElement(By.linkText("Validate a FHIR Resource")).click()
  await driver.findElement(By.id("validatePayload")).sendKeys(Key.CONTROL, "v")
  await driver.findElement({xpath: "//*[text() = 'Validate']"}).click()
  finaliseWebAction(driver, "VALIDATING FHIR RESOURCE...")
  await checkApiResult(driver, true)
}
