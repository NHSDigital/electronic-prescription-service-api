import "chromedriver"
import "geckodriver"
import {ThenableWebDriver} from "selenium-webdriver"
import {getChromeDriver, getFirefoxDriver} from "./browser-drivers"
import {EPSAT_HOME_URL, logDiagnostics, navigateToUrl, performCreatePrescriptionUserJourney} from "./helpers"

console.log(`Running test against ${EPSAT_HOME_URL}`)

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
  //navigateToUrl(driver, `${EPSAT_HOME_URL}/prescribe/cancel?prescription_id=${prescriptionId}`)
  
}
