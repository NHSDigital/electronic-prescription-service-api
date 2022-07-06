import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import {loadClinicalTestPack1Examples, loadPrescriptionTypeTestPack1Examples, loadPrescriptionTypeTestPack2Examples, loadSupplierTestPack1Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescriptions from clinical test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadClinicalTestPack1Examples, 25)
  })

  test("can send prescriptions from supplier test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadSupplierTestPack1Examples, 25)
  })

  test("can send prescriptions from prescription types test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadPrescriptionTypeTestPack1Examples, 25)
  })

  test("can send prescriptions from prescription types test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, loadPrescriptionTypeTestPack2Examples, 25)
  })
})
