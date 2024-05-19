import {By, Key, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {checkApiResult,
  defaultWaitTimeout,
  EPSAT_HOME_URL,
  finaliseWebAction,
  getElement,
  navigateToUrl,
  sendPrescriptionUserJourney,
  threeTimesDefaultWaitTimeout} from "../helpers"
import {copyFhirRequestButton, fhirRequestExpander} from "../locators"

describe("firefox", () => {
  test("can validate a fhir resource", async () => {
    await sendPrescriptionUserJourney(driver);
    (await getElement(driver, fhirRequestExpander)).click();
    (await getElement(driver, copyFhirRequestButton)).click()
    await navigateToUrl(driver, `${EPSAT_HOME_URL}/`)
    await validateFhirResourceUserJourney(driver)
  })
})

async function validateFhirResourceUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  finaliseWebAction(driver, "FINDING LINK FOR Validate a FHIR Resource...")
  await driver.wait(until.elementLocated(By.linkText("Validate a FHIR Resource")), threeTimesDefaultWaitTimeout)
  finaliseWebAction(driver, "CLICKING THE LINK FOR Validate a FHIR Resource...");
  (await getElement(driver, By.linkText("Validate a FHIR Resource"))).click()
  finaliseWebAction(driver, "WAITING FOR validatePayload to appear...")
  await driver.wait(until.elementsLocated(By.id("validatePayload")), defaultWaitTimeout)
  finaliseWebAction(driver, "PASTING THE CLIPBOARD INTO validatePayload...");
  (await getElement(driver, By.id("validatePayload"))).sendKeys(Key.CONTROL, "v")

  finaliseWebAction(driver, "CLICKING THE VALIDATE BUTTON...");
  (await getElement(driver, {xpath: "//*[text() = 'Validate']"})).click()
  finaliseWebAction(driver, "VALIDATING FHIR RESOURCE...")
  await checkApiResult(driver, true)
}
