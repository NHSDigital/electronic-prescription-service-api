import {driver} from "../live.test"
import {
  checkApiResult,
  createPrescription,
  finaliseWebAction,
  getElement,
  loadPredefinedExamplePrescription,
  loginViaSimulatedAuthSmartcardUser,
  sendPrescription,
  setMockSigningConfig,
  tenTimesDefaultWaitTimeout,
  viewPrescriptionUserJourney
} from "../helpers"
import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {sendPageTitle} from "../locators"

describe("firefox", () => {
  test("can edit the organisation on a prescription", async () => {
    const newOrganisation = "AAAAA"
    await editPrescriptionOrganisationUserJourney(driver, newOrganisation)
    await viewPrescriptionUserJourney(driver)
    await checkPrescriptionOrganisation(driver, newOrganisation)
  })
})

async function editPrescriptionOrganisationUserJourney(
  driver: ThenableWebDriver,
  newOrganisation: string
): Promise<void> {
  await loginViaSimulatedAuthSmartcardUser(driver)
  await setMockSigningConfig(driver)
  await createPrescription(driver)
  await loadPredefinedExamplePrescription(driver)
  await editPrescriptionOrganisation(driver, newOrganisation)
  await sendPrescription(driver)
  await checkApiResult(driver)
}

async function editPrescriptionOrganisation(
  driver: ThenableWebDriver,
  newOrganisation: string
): Promise<void> {
  await driver.wait(until.elementsLocated(sendPageTitle), tenTimesDefaultWaitTimeout)
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000))

  await (await getElement(driver, By.id("editPrescription"))).click()
  await (await getElement(driver, By.id("nominatedOds"))).clear()
  await (await getElement(driver, By.id("nominatedOds"))).sendKeys(newOrganisation)
  // wait 2 seconds for keys to complete
  await new Promise(r => setTimeout(r, 2000))

  finaliseWebAction(driver, `PRESCRIPTION ORGANISATION SET TO: ${newOrganisation}`)
}

async function checkPrescriptionOrganisation(
  driver: ThenableWebDriver,
  correctOrganisation: string
): Promise<void> {
  const dispenserRow =(await getElement(driver, By.id("prescriptionDispenser")))

  const prescriptionOrganisation = await dispenserRow.getAttribute("innerText")
  expect(prescriptionOrganisation).toBe(correctOrganisation)
  finaliseWebAction(driver, `PRESCRIPTION HAS CORRECT ORGANISATION: ${correctOrganisation}`)
}
