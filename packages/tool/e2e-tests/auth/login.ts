import {driver} from "../live.test"
import {loginUnattendedAccess, loginViaSimulatedAuthSmartcardUser} from "../helpers"

describe("firefox", () => {
  test("can login to attended session", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
  })

  test("can login to unattended session", async () => {
    await loginUnattendedAccess(driver)
  })
})
