import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as testPacks from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescriptions from clinical test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadClinicalTestPack1Examples, 25)
  })

  test("can send prescriptions from supplier test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadSupplierTestPack1Examples, 25)
  })

  test("can send prescriptions from prescription types test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadPrescriptionTypeTestPack1Examples, 25)
  })

  test("can send prescriptions from prescription types test pack 2", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadPrescriptionTypeTestPack2Examples, 25)
  })
})
