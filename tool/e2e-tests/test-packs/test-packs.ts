import {ThenableWebDriver, until} from "selenium-webdriver"
import {loadTestData} from "../helpers"

import {FileUploadInfo} from "../file-upload-info.ts/interfaces/FileUploadInfo.interface"
import {FileUploadType} from "../enums/FileUploadType.enum"

const {TestPack} = FileUploadType
const TestPackFileUploadInfo: FileUploadInfo = {fileName: "", filePath: "../test-packs/", uploadType: TestPack}


export async function loadClinicalFullPrescriberTestPack(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...TestPackFileUploadInfo, fileName: "Full Prescriber Volume Pack.xlsx"}
  await loadTestData(driver, fileInfo)
}

export async function loadSupplierTestPack(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...TestPackFileUploadInfo, fileName: "Supplier 1 Test Pack.xlsx"}
  await loadTestData(driver, fileInfo)
}

export async function loadPrescriptionTypeTestPack(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...TestPackFileUploadInfo, fileName: "Prescription Types Test Pack.xlsx"}
  await loadTestData(driver, fileInfo)
}

export async function loadPrescriptionTypesWithInvalidTypesTestPack(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...TestPackFileUploadInfo, fileName: "Test Pack - Script Types - Not Allowed.xlsx"}
  await loadTestData(driver, fileInfo)
}

export async function loadPostDatedPrescriptionTestPack(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...TestPackFileUploadInfo, fileName: "Post Dated Prescriptions Test Pack.xlsx"}
  await loadTestData(driver, fileInfo)
}

