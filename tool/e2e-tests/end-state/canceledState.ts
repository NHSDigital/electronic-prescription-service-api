import {prescriptionIntoCanceledState} from "../helpers"
import {driver} from "../live.test"
import * as fileInfoFactory from "../file-upload-info.ts/file-upload-info/Fhir-message-info"



describe("Prescription successfully cancelled", () => {

  test("with non-ASCII chars in dosage instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciiDosageInstructionsInfo())
  })

  test("with non-ASCII chars in note to dispense", async () => {

    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciiNotesToDispenseInfo())

  })

  test("with non-ASCII chars in Patient additional instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciIPatientAdditionalInstructionsInfo())

  })

  test("with XML tag in Patient additional Instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagPatientAdditionalInstructionsInfo())
  })

  test("with XML tag in Dosage Instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagDosageInstructionsInfo())
  })

  test("with XML tag in Note to dispenser", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagNotesToDispenserInfo())
  })

})
