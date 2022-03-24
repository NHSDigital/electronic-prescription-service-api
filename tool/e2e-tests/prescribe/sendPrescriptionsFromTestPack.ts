import {driver} from "../all.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadTestPack1Examples, loadTestPack2Examples, loadClinicalTestPack1Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test.skip("can send prescriptions from test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadTestPack1Examples, 5)
  })

  test.skip("can send prescriptions from test pack 2", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadTestPack2Examples, 30)
  })

  test("can send prescriptions from clinical test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadClinicalTestPack1Examples, 30)
  })
})
