import {By, Locator, ThenableWebDriver, until, WebElement} from "selenium-webdriver"
import {
  createPrescriptionsLink,
  dispenseButton,
  dispensePageTitle,
  dispensePrescriptionAction,
  fhirRequestExpander,
  fhirResponseExpander,
  hl7v3RequestExpander,
  hl7v3ResponseExpander,
  homePageTitle,
  itemFullyDispensedStatus,
  loadPageTitle,
  loginPageTitle,
  myPrescriptionsNavLink,
  myPrescriptionsPageTitle,
  sendPageTitle as sendPageTitle,
  releaseButton,
  releasePageTitle,
  releasePrescriptionAction,
  sendButton,
  simulatedAuthPageTitle,
  successTickIcon,
  systemButton,
  userButton,
  viewButton,
  backButton,
  configButton,
  configLink,
  configPageTitle,
  dispenseExpanderAction,
  AmendDispenseAction,
  itemAmendNotDispensedStatus,
  amendDispensePageTitle,
  claimPageTitle,
  claimButton,
  claimFormAddEndorsement,
  brokenBulkEndorsement,
  viewPrescriptionAction,
  searchDetailsPageTitle,
  cancelPrescriptionAction,
  cancelPrescriptionPageTitle,
  cancelButton,
  dispenseByFormRadio,
  dispenseWithBodyRadio,
  dispenseBodyField,
  logoutNavLink,
  logoutPageTitle
} from "./locators"
import path from "path"
import fs from "fs"
import * as fhir from "fhir/r4"
import {FileUploadInfo} from "./file-upload-info/interfaces/FileUploadInfo.interface"
import {getPrescriptionItemIds} from "./utils/prescriptionIds"
import {createDispenseBody} from "./utils/dispenseBody"

export const LOCAL_MODE = Boolean(process.env.LOCAL_MODE)
export const FIREFOX_BINARY_PATH = process.env.FIREFOX_BINARY_PATH || "/usr/bin/firefox"

export const SERVICE_BASE_PATH = process.env.SERVICE_BASE_PATH || "eps-api-tool"
export const APIGEE_ENVIRONMENT = process.env.APIGEE_ENVIRONMENT || "internal-dev"
export const EPSAT_HOME_URL = `https://${APIGEE_ENVIRONMENT}.api.service.nhs.uk/${SERVICE_BASE_PATH}/`

export const defaultWaitTimeout = 1500
export const twoTimesDefaultWaitTimeout = defaultWaitTimeout * 2
export const threeTimesDefaultWaitTimeout = defaultWaitTimeout * 3
export const fiveTimesDefaultWaitTimeout = defaultWaitTimeout * 5
export const tenTimesDefaultWaitTimeout = defaultWaitTimeout * 10
export const apiTimeout = 240000

export async function getElement(
  driver: ThenableWebDriver,
  locator: Locator
): Promise<WebElement> {
  try {
    await driver.wait(until.elementLocated(locator), tenTimesDefaultWaitTimeout, `Timeout waiting for ${JSON.stringify(locator)} to be located`)
      .then(async el => {
        await driver.wait(until.elementIsEnabled(el), tenTimesDefaultWaitTimeout, `Timeout waiting for ${JSON.stringify(locator)} to be enabled`)
      })
    return driver.findElement(locator)
  } catch(error) {
    console.log(`error finding ${JSON.stringify(locator)}`)
    throw error
  }
}

export async function sendPrescriptionUserJourney(driver: ThenableWebDriver): Promise<string> {
  await loginViaSimulatedAuthSmartcardUser(driver)
  await setMockSigningConfig(driver)
  await createPrescription(driver)
  await loadPredefinedExamplePrescription(driver)
  await sendPrescription(driver)
  await checkApiResult(driver)
  return await getCreatedPrescriptionId(driver)
}

export async function sendBulkPrescriptionUserJourney(driver: ThenableWebDriver, fileInfo: FileUploadInfo, successfulResultCountExpected: number): Promise<void> {
  await loginViaSimulatedAuthSmartcardUser(driver)
  await setMockSigningConfig(driver)
  await createPrescription(driver)
  await loadTestData(driver, fileInfo)
  await sendPrescription(driver)
  await checkBulkApiResult(driver, successfulResultCountExpected)
}

export async function prescriptionIntoClaimedState(driver: ThenableWebDriver, fileUploadInfo: FileUploadInfo): Promise<void> {
  const prescriptionId = await sendPrescriptionSingleMessageUserJourney(driver, fileUploadInfo)
  await releasePrescriptionUserJourney(driver)
  await dispensePrescriptionWithFormUserJourney(driver)
  await claimPrescriptionUserJourney(driver)
  await checkMyPrescriptions(driver, "Claimed Prescriptions", prescriptionId)
}

export async function prescriptionIntoCanceledState(driver: ThenableWebDriver, fileUploadInfo: FileUploadInfo): Promise<void> {
  await sendPrescriptionSingleMessageUserJourney(driver, fileUploadInfo)
  await cancelPrescriptionUserJourney(driver)
}

export async function sendPrescriptionSingleMessageUserJourney(driver: ThenableWebDriver, fileUploadInfo: FileUploadInfo): Promise<string> {
  await loginViaSimulatedAuthSmartcardUser(driver)
  await setMockSigningConfig(driver)
  await createPrescription(driver)
  await loadTestData(driver, fileUploadInfo)
  await sendPrescription(driver)
  await checkApiResult(driver)
  return await getCreatedPrescriptionId(driver)
}

export async function releasePrescriptionUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, releasePrescriptionAction)).click()

  await driver.wait(until.elementsLocated(releasePageTitle), defaultWaitTimeout)
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000));
  (await getElement(driver, By.id("pharmacy-1"))).click();
  (await getElement(driver, releaseButton)).click()

  finaliseWebAction(driver, "RELEASING PRESCRIPTION...")

  await checkApiResult(driver)
}

export async function viewPrescriptionUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, viewPrescriptionAction)).click()

  await driver.wait(until.elementsLocated(searchDetailsPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "VIEWED PRESCRIPTION")
}

export async function dispensePrescriptionWithFormUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, dispensePrescriptionAction)).click()
  await driver.wait(until.elementsLocated(dispensePageTitle), fiveTimesDefaultWaitTimeout);
  (await getElement(driver, dispenseByFormRadio)).click()

  const elements = await driver.findElements(itemFullyDispensedStatus)
  elements.forEach(element => element.click());
  (await getElement(driver, dispenseButton)).click()

  finaliseWebAction(driver, "DISPENSING PRESCRIPTION...")

  await checkApiResult(driver)
}

//createdispenseBody currently only works with the default Primary Care Paracetamol/Salbutamol prescription.
//getPrescriptionItemIds should be scalable
export async function dispensePrescriptionWithBodyUserJourney(driver: ThenableWebDriver, prescriptionId: string): Promise<void> {
  finaliseWebAction(driver, "FINDING PRESCRIPTION DETAILS...")

  const lineItemIds = await getPrescriptionItemIds(driver)

  const dispenseBody = createDispenseBody(prescriptionId, lineItemIds);

  (await getElement(driver, dispenseWithBodyRadio)).click();
  (await getElement(driver, dispenseBodyField)).sendKeys(dispenseBody);
  // wait 2 seconds for keys to be sent
  await new Promise(r => setTimeout(r, 2000));

  (await getElement(driver, dispenseButton)).click()

  finaliseWebAction(driver, "DISPENSING PRESCRIPTION...")

  await checkApiResult(driver)
}

export async function amendDispenseUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, dispenseExpanderAction)).click();
  (await getElement(driver, AmendDispenseAction)).click()

  await driver.wait(until.elementsLocated(amendDispensePageTitle), fiveTimesDefaultWaitTimeout)

  const elements = await driver.findElements(itemAmendNotDispensedStatus)
  elements.forEach(element => element.click());

  (await getElement(driver, dispenseButton)).click()

  finaliseWebAction(driver, "AMENDING DISPENSE...")

  await checkApiResult(driver)
}

export async function claimPrescriptionUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, By.linkText("Claim for prescription"))).click()
  await driver.wait(until.elementsLocated(claimPageTitle), defaultWaitTimeout)

  await driver.wait(until.elementsLocated(claimFormAddEndorsement), defaultWaitTimeout)
  const claimFormElements = await driver.findElements(claimFormAddEndorsement)
  claimFormElements.forEach(element => element.click())

  const brokenBulkElements = await driver.findElements(brokenBulkEndorsement)
  brokenBulkElements.forEach(element => element.click());

  (await getElement(driver, claimButton)).click()
  finaliseWebAction(driver, "CLAIMING PRESCRIPTION...")
  await checkApiResult(driver)
}

export async function cancelPrescriptionUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, cancelPrescriptionAction)).click()
  await driver.wait(until.elementsLocated(cancelPrescriptionPageTitle), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.findElements(By.name("cancellationMedication"))
  const firstMedicationToCancelRadio = medicationToCancelRadios[0]
  firstMedicationToCancelRadio.click();
  (await getElement(driver, cancelButton)).click()
  finaliseWebAction(driver, "CANCELLING PRESCRIPTION...")
  await checkApiResult(driver)
}

export async function claimAmendPrescriptionUserJourney(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, By.linkText("Amend the claim on this prescription"))).click()
  await driver.wait(until.elementsLocated(claimPageTitle), defaultWaitTimeout)

  await driver.wait(until.elementsLocated(claimFormAddEndorsement), defaultWaitTimeout)
  const claimFormlements = await driver.findElements(claimFormAddEndorsement)
  claimFormlements.forEach(element => element.click())

  const brokenBulkElements = await driver.findElements(brokenBulkEndorsement)
  brokenBulkElements.forEach(element => element.click())

  await driver.wait(until.elementsLocated(claimButton), defaultWaitTimeout);
  (await getElement(driver, claimButton)).click()
  finaliseWebAction(driver, "AMENDING CLAIM FOR PRESCRIPTION...")
  await checkApiResult(driver)
}

export async function checkMyPrescriptions(driver: ThenableWebDriver, tableName: string, prescriptionId: string): Promise<void> {
  (await getElement(driver, myPrescriptionsNavLink)).click()

  await driver.wait(until.elementsLocated(myPrescriptionsPageTitle), defaultWaitTimeout)
  const tableSelector = By.xpath(`//*[text() = '${tableName}']`)
  await driver.wait(until.elementsLocated(tableSelector), defaultWaitTimeout)
  const table = (await getElement(driver, tableSelector))

  const prescriptionEntryInTable = By.xpath(`//*[text() = '${prescriptionId}']`)
  expect(await table.findElement(prescriptionEntryInTable)).toBeTruthy()

  finaliseWebAction(driver, `MY_PRESCRIPTIONS '${tableName}' TABLE HAS PRESCRIPTION: ${prescriptionId}`)
}

export async function loginViaSimulatedAuthSmartcardUser(driver: ThenableWebDriver): Promise<void> {
  await navigateToUrl(driver, EPSAT_HOME_URL)
  await driver.wait(until.elementsLocated(loginPageTitle));
  (await getElement(driver, userButton)).click()

  await driver.wait(until.elementLocated(simulatedAuthPageTitle))
  await driver.wait(async () => {
    (await getElement(driver, By.id("username"))).sendKeys("555086689106");
    (await getElement(driver, By.id("kc-login"))).click()
    await driver.sleep(defaultWaitTimeout)
    const visibleButtons = await driver.findElements(By.className("kc-login"))
    return visibleButtons.length === 0
  }, twoTimesDefaultWaitTimeout)

  await navigateToUrl(driver, EPSAT_HOME_URL)
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "LOGIN SUCCESSFUL")
}

export async function loginUnattendedAccess(driver: ThenableWebDriver): Promise<void> {
  await navigateToUrl(driver, EPSAT_HOME_URL)

  await driver.wait(until.elementsLocated(loginPageTitle));
  (await getElement(driver, systemButton)).click()

  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "LOGIN SUCCESSFUL")
}

export async function updateConfigEpsPrNumber(driver: ThenableWebDriver, pr: number): Promise<void> {
  (await getElement(driver, configLink)).click()

  await driver.wait(until.elementLocated(configPageTitle));
  (await getElement(driver, By.name("epsPrNumber"))).sendKeys(pr);
  (await getElement(driver, By.name("useSigningMock"))).click();
  (await getElement(driver, configButton)).click()
  await driver.wait(until.elementLocated(backButton));
  (await getElement(driver, backButton)).click()
}

export async function navigateToUrl(driver: ThenableWebDriver, url: string): Promise<void> {
  await driver.get(url)
}

export async function createPrescription(driver: ThenableWebDriver): Promise<void> {
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout);
  (await getElement(driver, createPrescriptionsLink)).click()
  finaliseWebAction(driver, "CREATING PRESCRIPTION...")
}

export async function loadPredefinedExamplePrescription(driver: ThenableWebDriver, exampleName?: string): Promise<void> {
  const exampleNameOrDefault = exampleName ?? "Primary Care - Acute (nominated)"
  await driver.wait(until.elementsLocated(loadPageTitle), defaultWaitTimeout);
  (await getElement(driver, By.xpath(`//*[text() = '${exampleNameOrDefault}']`))).click();
  (await getElement(driver, viewButton)).click()
  finaliseWebAction(driver, "LOADING PRESCRIPTION...")
}

export async function sendPrescription(driver: ThenableWebDriver): Promise<void> {
  await driver.wait(until.elementsLocated(sendPageTitle), apiTimeout);
  (await getElement(driver, sendButton)).click()
  finaliseWebAction(driver, "SENDING PRESCRIPTION...")
}

export async function setMockSigningConfig(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, configLink)).click()
  await driver.wait(until.elementLocated(configPageTitle));
  (await getElement(driver, By.name("useSigningMock"))).click();
  (await getElement(driver, configButton)).click()
  await driver.wait(until.elementLocated(backButton));
  (await getElement(driver, backButton)).click()
}

export async function checkApiResult(driver: ThenableWebDriver, fhirOnly?: boolean): Promise<void> {
  await driver.wait(until.elementsLocated(fhirRequestExpander), apiTimeout)
  if (!fhirOnly) {
    await driver.wait(until.elementsLocated(hl7v3RequestExpander), apiTimeout)
  }

  expect(await getElement(driver, successTickIcon)).toBeTruthy()
  expect(await getElement(driver, fhirRequestExpander)).toBeTruthy()
  expect(await getElement(driver, fhirResponseExpander)).toBeTruthy()
  if (!fhirOnly) {
    expect(await getElement(driver, hl7v3RequestExpander)).toBeTruthy()
    expect(await getElement(driver, hl7v3ResponseExpander)).toBeTruthy()
  }
  finaliseWebAction(driver, "API RESULT SUCCESSFUL")
}

async function checkBulkApiResult(driver: ThenableWebDriver, expectedSuccessResultCount: number) {
  await driver.wait(until.elementsLocated(successTickIcon), apiTimeout)
  const successfulSendResults = await driver.findElements(successTickIcon)
  const successfulSendResultsCount = successfulSendResults.length
  expect(successfulSendResultsCount).toEqual(expectedSuccessResultCount)
  finaliseWebAction(driver, `API RESULT: ${successfulSendResultsCount} SUCCESSFUL CALLS`)
}

async function getCreatedPrescriptionId(driver: ThenableWebDriver): Promise<string> {
  const prescriptionId = await (await getElement(driver, By.className("nhsuk-summary-list__value"))).getText()
  finaliseWebAction(driver, `CREATED PRESCRIPTION: ${prescriptionId}`)
  return prescriptionId
}

export function finaliseWebAction(_driver: ThenableWebDriver, log: string) {
  //console.log([log, await driver.takeScreenshot()].join("\n"))
  console.log(log)
}

function readMessage<T extends fhir.Resource>(filename: string): T {
  const messagePath = path.join(__dirname, filename)
  const messageStr = fs.readFileSync(messagePath, "utf-8")
  return JSON.parse(messageStr)
}

export function readBundleFromFile(filename: string): fhir.Bundle {
  return readMessage<fhir.Bundle>(filename)
}

export async function loadTestData(driver: ThenableWebDriver, fileUploadInfo: FileUploadInfo): Promise<void> {
  const {filePath, fileName, uploadType} = fileUploadInfo
  const testPackUpload = await getUpload(driver, uploadType)
  finaliseWebAction(driver, "ENTERING filepath and name...")
  testPackUpload.sendKeys(path.join(__dirname, filePath, fileName))
  await loadPrescriptionsFromTestData(driver)
  await driver.wait(until.elementsLocated(sendPageTitle), apiTimeout)
}

export async function getUpload(driver: ThenableWebDriver, uploadType: number): Promise<WebElement> {
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000))
  const customRadioSelector = {xpath: "//*[@value = 'custom']"}
  finaliseWebAction(driver, "CLICKING customRadioSelector");
  (await getElement(driver, customRadioSelector)).click()
  finaliseWebAction(driver, "CLICKED customRadioSelector")
  const fileUploads = {xpath: "//*[@type = 'file']"}
  finaliseWebAction(driver, "FINDING fileUploads")
  await driver.wait(until.elementsLocated(fileUploads), defaultWaitTimeout)
  const upload = (await driver.findElements(fileUploads))[uploadType]
  return upload
}

export async function loadPrescriptionsFromTestData(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, {xpath: "//*[text() = 'View']"})).click()
}

export async function logout(driver: ThenableWebDriver): Promise<void> {
  (await getElement(driver, logoutNavLink)).click()
  await driver.wait(until.elementsLocated(logoutPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "LOGOUT SUCCESSFUL")
}
