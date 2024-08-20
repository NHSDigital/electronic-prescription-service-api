import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as fileInfoFactory from "../file-upload-info/upload-info/Test-pack-info"

describe("firefox", () => {
  test("can send prescriptions from clinical full prescriber test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getClinicalFullPrescriberTestPackInfo(), 25)
  })

  test("can send prescriptions from supplier test pack 1", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getSupplierTestPackInfo(), 25)
  })

  test("can send prescriptions from prescription types test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getPrescriptionTypeTestPackInfo(), 25)
  })

  test("can send prescriptions from prescription types with invalid types test pack", async () => {
    // eslint-disable-next-line max-len
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getPrescriptionTypesWithInvalidTypesTestPackInfo(), 25)
  })

  test("can send prescriptions from post dated prescription test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getPostDatedPrescriptionTestPackInfo(), 2)
  })
})
