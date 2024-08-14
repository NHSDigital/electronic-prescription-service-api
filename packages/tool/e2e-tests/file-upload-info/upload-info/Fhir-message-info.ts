/* eslint-disable max-len */
import {FileUploadType} from "../../enums/FileUploadType.enum"
import {FileUploadInfo} from "../interfaces/FileUploadInfo.interface"

export class FhirMessageUploadInfo implements FileUploadInfo {

  readonly fileName: string
  readonly filePath: string
  readonly uploadType: FileUploadType

  constructor(fName: string) {
    this.fileName = fName
    this.filePath = "/messages/"
    this.uploadType = FileUploadType.FHIRPrescriptionFile

  }

}

export const getNonAsciiNotesToDispenseInfo = (): FileUploadInfo => new FhirMessageUploadInfo("Non-ASCII Note to dispenser.json")
export const getNonAsciiDosageInstructionsInfo = (): FileUploadInfo => new FhirMessageUploadInfo("Non-ASCII Dosage Instructions.json")
export const getNonAsciIPatientAdditionalInstructionsInfo = (): FileUploadInfo => new FhirMessageUploadInfo("Non-ASCII Patient additional Instructions.json")
export const getXmlTagPatientAdditionalInstructionsInfo = (): FileUploadInfo => new FhirMessageUploadInfo("XML tag Patient additional Instructions.json")
export const getXmlTagNotesToDispenserInfo = (): FileUploadInfo => new FhirMessageUploadInfo("XML tag Note to dispenser.json")
export const getXmlTagDosageInstructionsInfo = (): FileUploadInfo => new FhirMessageUploadInfo("XML tag Dosage Instructions.json")
