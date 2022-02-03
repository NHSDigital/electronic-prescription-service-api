import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  defaultWaitTimeout,
  finaliseWebAction,
  loginUnattendedAccess,
  loginViaSimulatedAuthSmartcardUser
} from "../helpers"

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
  await driver.findElement(By.linkText("Logout")).click()

  const logoutPageTitle = {xpath: "//*[text() = 'You have been logged out']"}
  await driver.wait(until.elementsLocated(logoutPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "LOGOUT SUCCESSFUL")
}
