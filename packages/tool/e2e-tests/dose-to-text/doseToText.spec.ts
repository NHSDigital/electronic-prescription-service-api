import {driver} from "../sandbox.test"
import {By, until} from "selenium-webdriver"
import {doseToTextLink, homePageTitle, doseToTextTitle} from "../locators"
import {
  defaultWaitTimeout,
  EPSAT_HOME_URL,
  finaliseWebAction,
  navigateToUrl,
  checkApiResult,
  readBundleFromFile,
  getElement,
  waitForPageToRender
} from "../helpers"

const examplePrescription = JSON.stringify(readBundleFromFile("./messages/prescriptionOrder.json"))

describe("chrome", () => {
  test("can convert dose to text for prescription", async () => {
    await navigateToUrl(driver, `${EPSAT_HOME_URL}/`)
    await convertDoseToText()
  })
})

async function convertDoseToText() {
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  await (await getElement(driver, doseToTextLink)).click()
  await driver.wait(until.elementsLocated(doseToTextTitle), defaultWaitTimeout)
  await waitForPageToRender()

  await (await getElement(driver, By.id("doseToTextRequest"))).sendKeys(examplePrescription)
  // wait 2 seconds for keys to complete
  await new Promise(r => setTimeout(r, 2000))

  await (await getElement(driver, {xpath: "//*[text() = 'Convert']"})).click()
  await checkApiResult(driver, true)
  finaliseWebAction(driver, "SUCCESSFULLY TRANSLATED DOSE TO TEXT")
}
