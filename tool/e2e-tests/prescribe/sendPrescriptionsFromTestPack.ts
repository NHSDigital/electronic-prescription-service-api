import {driver} from "../all.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadTestPack1Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescriptions from test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadTestPack1Examples, 5)
  })
})
