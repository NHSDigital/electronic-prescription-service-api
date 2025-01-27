import {driver} from "../live.test"
import {loginUnattendedAccess, loginViaSimulatedAuthSmartcardUser, logout} from "../helpers"

describe("chrome", () => {
  test("can logout from attended session", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    await logout(driver)
  })

  test("can logout from unattended session", async () => {
    await loginUnattendedAccess(driver)
    await logout(driver)
  })
})
