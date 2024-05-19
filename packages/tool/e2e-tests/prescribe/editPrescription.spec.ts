import {driver} from "../live.test"
import {
  checkApiResult,
  createPrescription,
  defaultWaitTimeout,
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
  const editButtons = await driver.findElements(By.id("editPrescription"))
  const editButton = editButtons[0]
  await driver.wait(() => editButton.isDisplayed(), defaultWaitTimeout)
  await driver.wait(() => editButton.isEnabled(), defaultWaitTimeout)
  await driver.executeScript("arguments[0].scrollIntoView(true);", editButton)
  await editButton.click()
  await driver.wait(until.elementsLocated(By.id("nominatedOds")), defaultWaitTimeout);
  (await getElement(driver, By.id("nominatedOds"))).clear();
  (await getElement(driver, By.id("nominatedOds"))).sendKeys(newOrganisation)
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
