/* eslint-disable max-len */
import {FileUploadType} from "../../enums/FileUploadType.enum"
import {FileUploadInfo} from "../interfaces/FileUploadInfo.interface"

export class TestPackUploadInfo implements FileUploadInfo {

  readonly fileName: string
  readonly filePath: string
  readonly uploadType: FileUploadType

  constructor(fName: string) {
    this.fileName = fName
    this.filePath = "/test-packs/"
    this.uploadType = FileUploadType.TestPack

  }
}

export const getClinicalFullPrescriberTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Full Prescriber Volume Pack.xlsx")
export const getSupplierTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Supplier 1 Test Pack.xlsx")
export const getPrescriptionTypeTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Prescription Types Test Pack.xlsx")
export const getPrescriptionTypesWithInvalidTypesTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Test Pack - Script Types - Not Allowed.xlsx")
export const getPostDatedPrescriptionTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Post Dated Prescriptions Test Pack.xlsx")
export const getErdPrescriptionsTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("eRD Prescriptions Test Pack.xlsx")
export const getRepeatPrescriptionsTestPackInfo = (): FileUploadInfo => new TestPackUploadInfo("Repeat Prescriptions Test Pack.xlsx")
