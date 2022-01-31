import "chromedriver"
import "geckodriver"
import {until, By, ThenableWebDriver} from "selenium-webdriver"
import {getChromeDriver, getFirefoxDriver} from "./browser-drivers"

const SERVICE_BASE_PATH = process.env.SERVICE_BASE_PATH || "eps-api-tool"
const APIGEE_ENVIRONMENT = process.env.APIGEE_ENVIRONMENT || "internal-dev"
const EPSAT_URL = `https://${APIGEE_ENVIRONMENT}.api.service.nhs.uk/${SERVICE_BASE_PATH}`

console.log(`Running test against ${EPSAT_URL}`)

jest.setTimeout(60000)

describe("firefox", () => {
  test("can perform create prescription", async () => {
    const driver = getFirefoxDriver()
    try {
      await performCreatePrescription(driver)
    } catch (e) {
      await logDiagnostics(driver, e as Record<string, unknown>)
      throw e
    } finally {
      setTimeout(async() =>
        await driver.quit(),
        2500
      )
    }
  })
})

describe("chrome", () => {
  test("can perform create prescription", async () => {
    const driver = getChromeDriver()
    try {
      await performCreatePrescription(driver)
    } catch (e) {
      await logDiagnostics(driver, e as Record<string, unknown>)
      throw e
    } finally {
      await setTimeout(() =>
        driver.quit(),
        2500
      )
    }
  })
})

async function performCreatePrescription(
  driver: ThenableWebDriver
) {

  const url = EPSAT_URL

  // EPSAT Home redirect-> Login
  await navigateToUrl(driver, url)
  await driver.wait(until.urlContains("login"))
  await driver.wait(until.elementLocated(By.className("nhsuk-button")))

  // EPSAT Click [User] Button (internal-dev)
  const visibleButtons = await driver.findElements(By.className("nhsuk-button"))
  await visibleButtons[0].click()

  // Redirect-> simulated auth (internal-dev)
  await driver.wait(until.elementLocated(By.className("btn-primary")))
  await driver.wait(async () => {
    await driver.findElement(By.id("smartcard")).click()
    await driver.findElement(By.className("btn-primary")).click()
    await driver.sleep(1000)
    const visibleButtons = await driver.findElements(By.className("btn-primary"))
    return visibleButtons.length === 0
  }, 10000)
 
  // Home (wait for Create Prescriptions link to appear)
  await driver.wait(until.elementsLocated(By.linkText("Create Prescription(s)")))

  console.log("LOGIN SUCCESSFUL")
}

async function navigateToUrl(driver: ThenableWebDriver, url: string) {
  await driver.get(url)
}

async function logDiagnostics(driver: ThenableWebDriver, error: Record<string, unknown>) {
  const stackTrace = error.stack && `Stacktrace:\n\n${error.stack}\n\n`
  const url = `Current URL:\n\n${(await driver.getCurrentUrl())}\n\n`
  const source = `Page source:\n\n${(await driver.getPageSource())}`
  console.log(stackTrace, url, source)
}
