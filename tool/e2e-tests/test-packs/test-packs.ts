import {ThenableWebDriver, until} from "selenium-webdriver"
import {apiTimeout, defaultWaitTimeout} from "../helpers"
import path from "path"
import {sendPageTitle} from "../locators"
import {FileUploadInfo} from "../interfaces/FileUploadInfo.interface"

const TestPackFileUploadInfo: FileUploadInfo = {fileName: "", filePath: "../test-packs/", uploadElementIndex: 0}
const FHIRMessageFileUploadInfo: FileUploadInfo = {fileName: "", filePath: "../test-packs/FHIR-messages/", uploadElementIndex: 1}

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

export async function loadNonASCIIPatientAdditionalInstructionsFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "Non-ASCII Patient additional Instructions.json"}

  await loadTestData(driver, fileInfo)
}

export async function loadNonASCIIDosageInstructionsFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "Non-ASCII Dosage Instructions.json"}
  await loadTestData(driver, fileInfo)
}

export async function loadNonASCIINoteToDispenseFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "Non-ASCII Note to dispenser.json"}
  await loadTestData(driver, fileInfo)
}

export async function loadXMLTagPatientAdditionalInstructionsFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "XML tag Patient additional Instructions.json"}
  await loadTestData(driver, fileInfo)
}

export async function loadXMLTagNotesToDispenseFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "XML tag Note to dispenser.json"}
  await loadTestData(driver, fileInfo)
}

export async function loadXMLTagDosageInstructionsFHIRMessage(driver: ThenableWebDriver): Promise<void> {
  const fileInfo: FileUploadInfo = {...FHIRMessageFileUploadInfo, fileName: "XML tag Dosage Instructions.json"}
  await loadTestData(driver, fileInfo)
}


async function loadTestData(driver: ThenableWebDriver, fileUploadInfo: FileUploadInfo) {
  const {filePath, fileName, uploadElementIndex} = fileUploadInfo
  const testPackUpload = await getUpload(driver, uploadElementIndex)
  console.log(path.join(__dirname, filePath, fileName))
  testPackUpload.sendKeys(path.join(__dirname, filePath, fileName))
  await loadPrescriptionsFromTestPack(driver)
  await driver.wait(until.elementsLocated(sendPageTitle), apiTimeout)
}

async function getUpload(driver: ThenableWebDriver, uploadElementIndex: number) {
  const customRadioSelector = {xpath: "//*[@value = 'custom']"}
  await driver.wait(until.elementsLocated(customRadioSelector), defaultWaitTimeout)
  const customRadio = await driver.findElement(customRadioSelector)
  await customRadio.click()
  const fileUploads = {xpath: "//*[@type = 'file']"}
  await driver.wait(until.elementsLocated(fileUploads), defaultWaitTimeout)
  const testPackUpload = await (await driver.findElements(fileUploads))[uploadElementIndex]
  return testPackUpload
}

async function loadPrescriptionsFromTestPack(driver: ThenableWebDriver) {
  await driver.findElement({xpath: "//*[text() = 'View']"}).click()
}
