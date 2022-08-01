import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as testPacks from "../test-packs/test-packs"

describe("firefox", () => {
  test("can send prescriptions from clinical full prescriber test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadClinicalFullPrescriberTestPack, 25)
  })

  test("can send prescriptions from supplier test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadSupplierTestPack, 25)
  })

  test("can send prescriptions from prescription types test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadPrescriptionTypeTestPack, 25)
  })

  test("can send prescriptions from prescription types with invalid types test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadPrescriptionTypesWithInvalidTypesTestPack, 25)
  })

  test("can send prescriptions from post dated prescription test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadPostDatedPrescriptionTestPack, 2)
  })
})
