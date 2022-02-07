import {driver} from "../all.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadTestPack1Examples, loadTestPack2Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  // todo: unpick validation rule changes which have made a breaking change here
  test.skip("can send prescriptions from test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadTestPack1Examples, 5)
  })

  test("can send prescriptions from test pack 2", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadTestPack2Examples, 30)
  })
})
