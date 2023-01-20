import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as fileInfoFactory from "../file-upload-info/upload-info/Test-pack-info"

describe("firefox", () => {
  test("can send repeat prescriptions from eRD test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getErdPrescriptionsTestPackInfo(), 1)
  })

  test("can send repeat prescriptions from repeat prescriptions test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getRepeatPrescriptionsTestPackInfo(), 1)
  })
})

