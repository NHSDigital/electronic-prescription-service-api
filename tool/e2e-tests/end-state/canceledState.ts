import {prescriptionIntoCanceledState} from "../helpers"
import {driver} from "../live.test"
import * as fileInfoFactory from "../file-upload-info/upload-info/Fhir-message-info"

describe("Prescription successfully cancelled", () => {
  test("with non-ASCII chars in dosage instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciiDosageInstructionsInfo())
  })
  test("with non-ASCII chars in note to dispenser", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciiNotesToDispenseInfo())
  })
  test("with non-ASCII chars in patient additional instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getNonAsciIPatientAdditionalInstructionsInfo())
  })
  test("with XML tag in patient additional instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagPatientAdditionalInstructionsInfo())
  })
  test("with XML tag in dosage instructions", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagDosageInstructionsInfo())
  })
  test("with XML tag in note to dispenser", async () => {
    await prescriptionIntoCanceledState(driver, fileInfoFactory.getXmlTagNotesToDispenserInfo())
  })
})
