import {driver} from "../live.test"
import {sendBulkPrescriptionUserJourney} from "../helpers"
import * as fileInfoFactory from "../file-upload-info/upload-info/Test-pack-info"

describe("firefox", () => {
  test("can send prescriptions from clinical full prescriber test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, fileInfoFactory.getClinicalFullPrescriberTestPackInfo(), 10)
  })
})

