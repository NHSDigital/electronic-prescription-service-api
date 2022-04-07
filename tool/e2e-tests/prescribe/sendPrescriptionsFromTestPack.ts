import {driver} from "../all.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadClinicalTestPack1Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test.skip("can send prescriptions from test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadClinicalTestPack1Examples, 5)
  })
})
