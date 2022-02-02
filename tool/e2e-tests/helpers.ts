import {By, ThenableWebDriver, until} from "selenium-webdriver"

export const SERVICE_BASE_PATH = process.env.SERVICE_BASE_PATH || "eps-api-tool"
export const APIGEE_ENVIRONMENT = "internal-dev"
export const EPSAT_HOME_URL = `https://${APIGEE_ENVIRONMENT}.api.service.nhs.uk/${SERVICE_BASE_PATH}`

export async function performCreatePrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<string> {

  const url = `${EPSAT_HOME_URL}?use_signing_mock=true`

  await login(driver, url)
  await createPrescription(driver)
  await loadPredefinedExamplePrescription(driver)
  await sendPrescription(driver)
  await checkApiResult(driver)

  return await getCreatedPrescriptionId(driver)
}


async function login(driver: ThenableWebDriver, url: string) {
  await navigateToUrl(driver, url)
  await driver.wait(until.elementsLocated({ xpath: "//*[text() = 'Login']" }))
  await driver.findElement({ xpath: "//*[text() = 'User']" }).click()

  await driver.wait(until.elementLocated({ xpath: "//*[text() = 'Simulated login page']" }))
  await driver.wait(async () => {
    await driver.findElement(By.id("smartcard")).click()
    await driver.findElement(By.className("btn-primary")).click()
    await driver.sleep(1000)
    const visibleButtons = await driver.findElements(By.className("btn-primary"))
    return visibleButtons.length === 0
  }, 10000)

  finaliseWebAction(driver, "LOGIN SUCCESSFUL")
}

export async function navigateToUrl(driver: ThenableWebDriver, url: string) {
  await driver.get(url)
}

export const defaultWaitTimeout = 5000

async function createPrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({ xpath: "//*[text() = 'I would like to...']" }), defaultWaitTimeout)
  await driver.findElement(By.linkText("Create Prescription(s)")).click()
  finaliseWebAction(driver, "CREATE PRESCRIPTION SUCCESSFUL")
}

async function loadPredefinedExamplePrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({ xpath: "//*[text() = 'Load prescription(s)']" }), defaultWaitTimeout)
  await driver.findElement({ xpath: "//*[text() = 'View']" }).click()
  finaliseWebAction(driver, "LOAD PRESCRIPTION SUCCESSFUL")
}

async function sendPrescription(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({ xpath: "//*[text() = 'Prescription Summary']" }), defaultWaitTimeout)
  await driver.findElement({ xpath: "//*[text() = 'Send']" }).click()
  finaliseWebAction(driver, "SEND PRESCRIPTION SUCCESSFUL")
}

export async function checkApiResult(driver: ThenableWebDriver) {
  await driver.wait(until.elementsLocated({ xpath: "//*[text() = 'Request (FHIR)']" }), 10000)
  expect(await driver.findElement(By.className("nhsuk-icon__tick"))).toBeTruthy()
  expect(await driver.findElement({ xpath: "//*[text() = 'Request (FHIR)']" })).toBeTruthy()
  expect(await driver.findElement({ xpath: "//*[text() = 'Request (HL7 V3)']" })).toBeTruthy()
  expect(await driver.findElement({ xpath: "//*[text() = 'Response (FHIR)']" })).toBeTruthy()
  expect(await driver.findElement({ xpath: "//*[text() = 'Response (HL7 V3)']" })).toBeTruthy()
  finaliseWebAction(driver, "API RESULT SUCCESSFUL")
}

async function getCreatedPrescriptionId(driver: ThenableWebDriver): Promise<string> {
  return await driver.findElement(By.className("nhsuk-summary-list__value")).getText()
}

const waitToAvoidSpikeArrest = 2000

export function finaliseWebAction(driver: ThenableWebDriver, log: string) {
  console.log(log)
  driver.sleep(waitToAvoidSpikeArrest)
}
