import {ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  defaultWaitTimeout,
  finaliseWebAction,
  loginUnattendedAccess,
  loginViaSimulatedAuthSmartcardUser
} from "../helpers"
import {logoutNavLink, logoutPageTitle} from "../locators"

describe("firefox", () => {
  test("can logout from attended session", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    await logout(driver)
  })

  test("can logout from unattended session", async () => {
    await loginUnattendedAccess(driver)
    await logout(driver)
  })
})

async function logout(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(logoutNavLink).click()
  await driver.wait(until.elementsLocated(logoutPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "LOGOUT SUCCESSFUL")
}
