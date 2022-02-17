import {By, ThenableWebDriver} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  releasePrescriptionUserJourney,
  finaliseWebAction,
  createPrescription,
  sendPrescription,
  checkApiResult,
  loginViaSimulatedAuthSmartcardUser,
  loadPredefinedExamplePrescription,
  //updateConfigEpsPrNumber
} from "../helpers"
import {verifyPrescriptionAction} from "../locators"

describe("firefox", () => {
  test.each([
    "Primary Care - Acute (nominated)",
    "Primary Care - Repeat Prescribing (nominated)",
    "Primary Care - Repeat Dispensing (nominated)",
    "Secondary Care - Acute (nominated)",
    "Secondary Care - Acute",
    "Secondary Care - Repeat Dispensing (nominated)"
  ])("can verify %p prescription", async (exampleName: string) => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    //await updateConfigEpsPrNumber(driver, 751)
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
  finaliseWebAction(driver, "VERIFYING PRESCRIPTION...")
  await checkApiResult(driver, true)
  await finaliseWebAction(driver, "VERIFY SUCCESSFUL")
}
