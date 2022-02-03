import {By, ThenableWebDriver, until} from "selenium-webdriver"

export const LOCAL_MODE = Boolean(process.env.LOCAL_MODE)

export const SERVICE_BASE_PATH = process.env.SERVICE_BASE_PATH || "eps-api-tool"
export const APIGEE_ENVIRONMENT = "internal-dev"
export const EPSAT_HOME_URL = `https://${APIGEE_ENVIRONMENT}.api.service.nhs.uk/${SERVICE_BASE_PATH}`

export async function sendPrescriptionUserJourney(
  driver: ThenableWebDriver,
  loadExamples?: (driver: ThenableWebDriver) => Promise<void>
): Promise<string | null> {

  await loginViaSimulatedAuthSmartcardUser(driver)
  await createPrescription(driver)

  if (loadExamples)
  {
    await loadExamples(driver)
    await sendPrescription(driver)
    return null
  }
  
  await loadPredefinedExamplePrescription(driver)
  await sendPrescription(driver)
  await checkApiResult(driver)

  return await getCreatedPrescriptionId(driver)
}

export async function releasePrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Release prescription")).click()

  const releasePageTitle = {xpath: "//*[text() = 'Release prescription(s)']"}
  await driver.wait(until.elementsLocated(releasePageTitle), defaultWaitTimeout)
  const pharmacyToReleaseToRadios = await driver.wait(until.elementsLocated(By.name("pharmacy")), twoTimesDefaultWaitTimeout)
  pharmacyToReleaseToRadios[0].click()
  finaliseWebAction(driver, "RELEASE PRESCRIPTION SUCCESSFUL")

  const releaseButton = {xpath: "//*[text() = 'Release']"}
  await driver.wait(until.elementsLocated(releaseButton), defaultWaitTimeout)
  await driver.findElement(releaseButton).click()
  await checkApiResult(driver)
}

export async function dispensePrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(By.linkText("Dispense prescription")).click()

  const dispensePageTitle = {xpath: "//*[text() = 'Dispense Prescription']"}
  await driver.wait(until.elementsLocated(dispensePageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "DISPENSE PRESCRIPTION SUCCESSFUL")

  await (await driver.findElements({xpath: "//select/option[text() = 'Item fully dispensed']"}))
    .forEach(element => element.click())

  const dispenseButton = {xpath: "//*[text() = 'Dispense']"}
  await driver.wait(until.elementsLocated(dispenseButton), defaultWaitTimeout)
  await driver.findElement(dispenseButton).click()
  await checkApiResult(driver)
}

export async function checkMyPrescriptions(
  driver: ThenableWebDriver,
  tableName: string,
  prescriptionId: string
): Promise<void> {
  const myPrescriptionsPageTitle = {xpath: "//*[text() = 'My Prescriptions']"}
  await driver.findElement(myPrescriptionsPageTitle).click()
  await driver.wait(until.elementsLocated(myPrescriptionsPageTitle), defaultWaitTimeout)
  const tableSelector = {xpath: `//*[text() = '${tableName}']`}
  await driver.wait(until.elementsLocated(tableSelector), defaultWaitTimeout)
  const table = await driver.findElement(tableSelector)
  const prescriptionEntryInTable = {xpath: `//*[text() = '${prescriptionId}']`}
  expect(await table.findElement(prescriptionEntryInTable)).toBeTruthy()
  finaliseWebAction(driver, `MY_PRESCRIPTIONS '${tableName}' TABLE HAS PRESCRIPTION: ${prescriptionId}`)
}

export async function loginViaSimulatedAuthSmartcardUser(driver: ThenableWebDriver): Promise<void> {
  const url = `${EPSAT_HOME_URL}?use_signing_mock=true`

  await navigateToUrl(driver, url)
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Login']"}))
  await driver.findElement({xpath: "//*[text() = 'User']"}).click()

  await driver.wait(until.elementLocated({xpath: "//*[text() = 'Simulated login page']"}))
  await driver.wait(async () => {
    await driver.findElement(By.id("smartcard")).click()
    await driver.findElement(By.className("btn-primary")).click()
    await driver.sleep(defaultWaitTimeout)
    const visibleButtons = await driver.findElements(By.className("btn-primary"))
    return visibleButtons.length === 0
  }, twoTimesDefaultWaitTimeout)

  await finaliseWebAction(driver, "LOGIN SUCCESSFUL")
}

export async function loginUnattendedAccess(driver: ThenableWebDriver): Promise<void> {
  const url = `${EPSAT_HOME_URL}?use_signing_mock=true`

  await navigateToUrl(driver, url)
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Login']"}))
  await driver.findElement({xpath: "//*[text() = 'System']"}).click()

  await finaliseWebAction(driver, "LOGIN SUCCESSFUL")
}

export async function navigateToUrl(driver: ThenableWebDriver, url: string): Promise<void> {
  await driver.get(url)
}

export const defaultWaitTimeout = 1500
export const twoTimesDefaultWaitTimeout = defaultWaitTimeout * 2
export const threeTimesDefaultWaitTimeout = defaultWaitTimeout * 3
export const fourTimesDefaultWaitTimeout = defaultWaitTimeout * 4
export const tenTimesDefaultWaitTimeout = defaultWaitTimeout * 10
export const apiTimeout = 240000

async function createPrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'I would like to...']"}), defaultWaitTimeout)
  await driver.findElement(By.linkText("Create Prescription(s)")).click()
  await finaliseWebAction(driver, "CREATE PRESCRIPTION SUCCESSFUL")
}

async function loadPredefinedExamplePrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Load prescription(s)']"}), defaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'View']"}).click()
  await finaliseWebAction(driver, "LOAD PRESCRIPTION SUCCESSFUL")
}

async function sendPrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Prescription Summary']"}), tenTimesDefaultWaitTimeout)
  await driver.findElement({xpath: "//*[text() = 'Send']"}).click()
  await finaliseWebAction(driver, "SEND PRESCRIPTION SUCCESSFUL")
}

export async function checkApiResult(driver: ThenableWebDriver): Promise<void> {
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Request (FHIR)']"}), apiTimeout)
  expect(await driver.findElement(By.className("nhsuk-icon__tick"))).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Request (FHIR)']"})).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Request (HL7 V3)']"})).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Response (FHIR)']"})).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Response (HL7 V3)']"})).toBeTruthy()
  await finaliseWebAction(driver, "API RESULT SUCCESSFUL")
}

export async function checkFhirApiResult(driver: ThenableWebDriver): Promise<void> {
  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Request (FHIR)']"}), threeTimesDefaultWaitTimeout)
  expect(await driver.findElement(By.className("nhsuk-icon__tick"))).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Request (FHIR)']"})).toBeTruthy()
  expect(await driver.findElement({xpath: "//*[text() = 'Response (FHIR)']"})).toBeTruthy()
  await finaliseWebAction(driver, "API RESULT SUCCESSFUL")
}

async function getCreatedPrescriptionId(driver: ThenableWebDriver): Promise<string> {
  const prescriptionId = await driver.findElement(By.className("nhsuk-summary-list__value")).getText()
  await finaliseWebAction(driver, `CREATED PRESCRIPTION: ${prescriptionId}`)
  return prescriptionId
}

const waitToAvoidSpikeArrest = 0

export async function finaliseWebAction(driver: ThenableWebDriver, log: string): Promise<void> {
  console.log(log)
  await driver.sleep(waitToAvoidSpikeArrest)
}
