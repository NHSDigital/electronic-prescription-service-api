import {prescriptionIntoClaimedState} from "../helpers"
import {driver} from "../live.test"
import * as fileInfoFactory from "../file-upload-info.ts/file-upload-info/Fhir-message-info"



fdescribe("Prescription successfully claimed", () => {

  test("with non-ASCII chars in dosage instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciiDosageInstructionsInfo())
  })

  test("with non-ASCII chars in note to dispense", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciiNotesToDispenseInfo())
  })

  test("with non-ASCII chars in additional instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getNonAsciIPatientAdditionalInstructionsInfo())
  })

  test("with XML tag in Patient additional Instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagPatientAdditionalInstructionsInfo())
  })

  test("with XML tag in Dosage Instructions", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagDosageInstructionsInfo())
  })

  test("with XML tag in Note to dispenser", async () => {
    await prescriptionIntoClaimedState(driver, fileInfoFactory.getXmlTagNotesToDispenserInfo())
  })

})


