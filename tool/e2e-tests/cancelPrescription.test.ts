import "chromedriver"
import "geckodriver"
import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {getChromeDriver, getFirefoxDriver} from "./browser-drivers"
import {checkApiResult, defaultWaitTimeout, EPSAT_HOME_URL, logDiagnostics, navigateToUrl, performCreatePrescriptionUserJourney} from "./helpers"

console.log(`Running test against ${EPSAT_HOME_URL}`)

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

describe("firefox", () => {
  test("can cancel prescription", async () => {
    const driver = getFirefoxDriver()
    try {
      await doTest(driver)
    } catch (e) {
      await logDiagnostics(driver, e as Record<string, unknown>)
      process.exit(1)
    } finally {
      await driver.close()
    }
  })
})

// ADO issue using chromedriver: "DevToolsActivePort file doesn't exist"
describe("chrome", () => {
  test.skip("can cancel prescription", async () => {
    const driver = getChromeDriver()
    try {
      await doTest(driver)
    } catch (e) {
      await logDiagnostics(driver, e as Record<string, unknown>)
      throw e
    } finally {
        driver.close()
    }
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await performCreatePrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
  console.log(`Created Prescription: ${prescriptionId}`)
  await performCancelPrescriptionUserJourney(driver, prescriptionId)
  console.log(`Cancelled Prescription: ${prescriptionId}`)
}

async function performCancelPrescriptionUserJourney(
  driver: ThenableWebDriver,
  prescriptionId: string
): Promise<void> {
  navigateToUrl(driver, `${EPSAT_HOME_URL}/prescribe/cancel?prescription_id=${prescriptionId}`)
  const medicationToCancelRadios = await driver.wait(until.elementsLocated(By.name("cancellationMedication")), defaultWaitTimeout)
  medicationToCancelRadios[0].click()
  await driver.findElement({ xpath: "//*[text() = 'Cancel']" }).click()
  await checkApiResult(driver)
}
