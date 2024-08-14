import {ThenableWebDriver, until} from "selenium-webdriver"
import {fiveTimesDefaultWaitTimeout, getElement, waitForPageToRender} from "../helpers"
import {
  checkFirstReleasedPrescriptionStatusButton,
  dispenseButton,
  dispensePrescriptionAction,
  myPrescriptionsNavLink,
  prescriptionLineItemIds
} from "../locators"

export async function getPrescriptionItemIds(
  driver: ThenableWebDriver
): Promise<Array<string>> {
  await (await getElement(driver, myPrescriptionsNavLink)).click()
  await waitForPageToRender(10000)

  await driver.wait(
    until.elementsLocated(checkFirstReleasedPrescriptionStatusButton),
    fiveTimesDefaultWaitTimeout
  )

  await (await getElement(driver, checkFirstReleasedPrescriptionStatusButton)).click()
  await driver.wait(
    until.elementsLocated(dispensePrescriptionAction),
    fiveTimesDefaultWaitTimeout
  )
  await waitForPageToRender(10000)

  const idElements = await driver.findElements(prescriptionLineItemIds)
  const idPromises = idElements.map(element => element.getText())
  await (await getElement(driver, dispensePrescriptionAction)).click()

  await driver.wait(
    until.elementsLocated(dispenseButton),
    fiveTimesDefaultWaitTimeout
  )

  return Promise.all(idPromises)
}
