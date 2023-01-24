import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as fileInfoFactory from "../file-upload-info/upload-info/Test-pack-info"

describe("firefox", () => {
  test("can send repeat-dispensing prescriptions from eRD test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getErdPrescriptionsTestPackInfo(), 22)
  })

  test("can send repeat prescriptions from repeat prescriptions test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getRepeatPrescriptionsTestPackInfo(), 22)
  })
})
