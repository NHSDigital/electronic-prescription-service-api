import {prescriptionIntoClaimedState} from "../helpers"
import {driver} from "../live.test"
import * as fileInfoFactory from "../file-upload-info/upload-info/Fhir-message-info"

describe("Prescription successfully claimed", () => {
  test("with non-ASCII chars in dosage instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciiDosageInstructionsInfo())
  })
  test("with non-ASCII chars in note to dispenser", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciiNotesToDispenseInfo())
  })
  test("with non-ASCII chars in additional instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciIPatientAdditionalInstructionsInfo())
  })
  test("with XML tag in patient additional instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagPatientAdditionalInstructionsInfo())
  })
  test("with XML tag in dosage instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagDosageInstructionsInfo())
  })
  test("with XML tag in note to dispenser", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagNotesToDispenserInfo())
  })
})

