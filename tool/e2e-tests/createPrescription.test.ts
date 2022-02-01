import "chromedriver"
import "geckodriver"
import {ThenableWebDriver} from "selenium-webdriver"
import {getChromeDriver, getFirefoxDriver} from "./browser-drivers"
import {EPSAT_HOME_URL, logDiagnostics, performCreatePrescriptionUserJourney} from "./helpers"

console.log(`Running test against ${EPSAT_HOME_URL}`)

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

describe("firefox", () => {
  test("can create prescription", async () => {
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
  test.skip("can create prescription", async () => {
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
}
