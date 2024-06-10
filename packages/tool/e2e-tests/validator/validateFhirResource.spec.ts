import {By, Key, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {checkApiResult,
  defaultWaitTimeout,
  EPSAT_HOME_URL,
  finaliseWebAction,
  getElement,
  navigateToUrl,
  sendPrescriptionUserJourney,
  waitForPageToRender} from "../helpers"
import {copyFhirRequestButton, fhirRequestExpander} from "../locators"

describe("firefox", () => {
  test("can validate a fhir resource", async () => {
    await sendPrescriptionUserJourney(driver)
    await (await getElement(driver, fhirRequestExpander)).click()
    await (await getElement(driver, copyFhirRequestButton)).click()
    // wait 2 seconds for copy to complete
    await new Promise(r => setTimeout(r, 2000))
    await navigateToUrl(driver, `${EPSAT_HOME_URL}/`)
    await validateFhirResourceUserJourney(driver)
  })
})

async function validateFhirResourceUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  finaliseWebAction(driver, "CLICKING THE LINK FOR Validate a FHIR Resource...")
  await (await getElement(driver, By.linkText("Validate a FHIR Resource"))).click()
  await waitForPageToRender()
  finaliseWebAction(driver, "WAITING FOR validatePayload to appear...")
  await driver.wait(until.elementsLocated(By.id("validatePayload")), defaultWaitTimeout)
  finaliseWebAction(driver, "PASTING THE CLIPBOARD INTO validatePayload...")
  await (await getElement(driver, By.id("validatePayload"))).sendKeys(Key.SHIFT, Key.INSERT)
  await waitForPageToRender()

  finaliseWebAction(driver, "CLICKING THE VALIDATE BUTTON...")
  await (await getElement(driver, {xpath: "//*[text() = 'Validate']"})).click()
  finaliseWebAction(driver, "VALIDATING FHIR RESOURCE...")
  await checkApiResult(driver, true)
}
