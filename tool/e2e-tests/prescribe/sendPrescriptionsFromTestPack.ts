import { driver } from "../live.test"
import { sendBulkPrescriptionUserJourney } from "../helpers"
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

describe('Can send perscriptions with ASCII chars within free text fields ', () => {

  test(" from ASCII Dosage Instructions Perscriptions test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadASCIICharsDosageInstructionsPrescriptionTestPack, 25)
  })

  test("from ASCII Patient additional Instructions Perscriptions test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadASCIIPatientAdditionalInstructionsPrescriptionTestPack, 25)
  })

  test("from ASCII Note To Dispenser Perscriptions test pack", async () => {
    await sendBulkPrescriptionUserJourney(driver, testPacks.loadASCIINoteToDispenserPerscriptionsPrescriptionTestPack, 25)
  })
})
