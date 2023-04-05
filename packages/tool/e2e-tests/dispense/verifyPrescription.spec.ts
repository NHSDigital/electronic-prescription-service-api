import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  releasePrescriptionUserJourney,
  finaliseWebAction,
  createPrescription,
  sendPrescription,
  checkApiResult,
  loginViaSimulatedAuthSmartcardUser,
  loadPredefinedExamplePrescription, setMockSigningConfig
} from "../helpers"
import {verifyPrescriptionAction} from "../locators"

describe("firefox", () => {
  test.each([
    "Primary Care - Acute (nominated)",
    // "Primary Care - Repeat Prescribing (nominated)",
    // "Primary Care - Repeat Dispensing (nominated)",
    // "Secondary Care - Acute (nominated)"
    // "Secondary Care - Acute"
    // "Secondary Care - Repeat Dispensing (nominated)"
  ])("can verify %p prescription", async (exampleName: string) => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    await setMockSigningConfig(driver)
    await createPrescription(driver)
    await loadPredefinedExamplePrescription(driver, exampleName)
    await sendPrescription(driver)
    await checkApiResult(driver)
    await releasePrescriptionUserJourney(driver)
    await verifyPrescriptionUserJourney(driver)
  })
})

async function verifyPrescriptionUserJourney(driver: ThenableWebDriver) {
  await driver.findElement(verifyPrescriptionAction).click()
  await finaliseWebAction(driver, "VERIFYING PRESCRIPTION...")
  await checkApiResult(driver, true)
  await finaliseWebAction(driver, "VERIFY SUCCESSFUL")
}
