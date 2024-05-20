import {ThenableWebDriver, until} from "selenium-webdriver"
import {fiveTimesDefaultWaitTimeout, getElement} from "../helpers"
import {
  checkFirstReleasedPrescriptionStatusButton,
  dispenseButton,
  dispensePrescriptionAction,
  myPrescriptionsNavLink,
  prescriptionLineItemIds
} from "../locators"

export async function getPrescriptionItemIds(
  driver: ThenableWebDriver
): Promise<string[]> {
  (await getElement(driver, myPrescriptionsNavLink)).click()

  // wait 10 seconds for click to register
  await new Promise(r => setTimeout(r, 10000))

  await driver.wait(
    until.elementsLocated(checkFirstReleasedPrescriptionStatusButton),
    fiveTimesDefaultWaitTimeout
  );

  (await getElement(driver, checkFirstReleasedPrescriptionStatusButton)).click()
  await driver.wait(
    until.elementsLocated(dispensePrescriptionAction),
    fiveTimesDefaultWaitTimeout
  )
  // wait 10 seconds for page to refresh
  await new Promise(r => setTimeout(r, 10000))

  const idElements = await driver.findElements(prescriptionLineItemIds)
  const idPromises = idElements.map(element => element.getText());
  (await getElement(driver, dispensePrescriptionAction)).click()

  await driver.wait(
    until.elementsLocated(dispenseButton),
    fiveTimesDefaultWaitTimeout
  )

  return Promise.all(idPromises)
}
