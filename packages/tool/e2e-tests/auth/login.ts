import {driver} from "../live.test"
import {loginUnattendedAccess, loginViaSimulatedAuthSmartcardUser} from "../helpers"
import assert from 'node:assert/strict';

describe("firefox", () => {
  test("can login to attended session", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    assert.fail('testing failure');
  })

  test("can login to unattended session", async () => {
    await loginUnattendedAccess(driver)
  })
})
