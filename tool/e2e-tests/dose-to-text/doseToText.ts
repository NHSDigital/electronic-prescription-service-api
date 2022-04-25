import {driver} from "../sandbox.test"
import {until} from "selenium-webdriver"
import {doseToTextLink, homePageTitle} from "../locators"
import {defaultWaitTimeout, EPSAT_HOME_URL, finaliseWebAction, navigateToUrl} from "../helpers"

describe("firefox", () => {
  test("can convert dose to text for prescription", async () => {
    await navigateToUrl(driver, EPSAT_HOME_URL)
    await convertDoseToText()
  })
})

async function convertDoseToText() {
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  await driver.findElement(doseToTextLink).click()
  await finaliseWebAction(driver, "MOVED TO DOSE TO TEXT PAGE")
}
