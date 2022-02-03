import {driver} from "../all.test"
import {loginUnattendedAccess} from "../helpers"

describe("firefox", () => {
  test("can login to unattended session", async () => {
    await loginUnattendedAccess(driver)
  })
})
