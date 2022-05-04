import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadClinicalTestPack1Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescriptions from clinical test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadClinicalTestPack1Examples, 25)
  })
})
