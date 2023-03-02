import {ThenableWebDriver, until} from "selenium-webdriver"
import {finaliseWebAction, fiveTimesDefaultWaitTimeout} from "../helpers"
import {
  checkFirstReleasedPrescriptionStatusButton,
  dispenseButton,
  dispensePrescriptionAction,
  myPrescriptionsNavLink,
  myPrescriptionsPageTitle,
  // myPrescriptionsPageTitle,
  prescriptionDetailsPageTitle,
  prescriptionLineItemIds
} from "../locators"

export async function getPrescriptionIdFromUrl(
  driver: ThenableWebDriver
): Promise<string> {
  return (await driver.getCurrentUrl()).split("=")[1]
}

export async function getPrescriptionItemIds(
  driver: ThenableWebDriver
): Promise<string[]> {
  await driver.findElement(myPrescriptionsNavLink).click()

  await driver.wait(
    until.elementsLocated(checkFirstReleasedPrescriptionStatusButton),
    fiveTimesDefaultWaitTimeout
  )

  await driver.findElement(checkFirstReleasedPrescriptionStatusButton).click()

  await driver.wait(
    until.elementsLocated(dispensePrescriptionAction),
    fiveTimesDefaultWaitTimeout
  )

  const idElements = await driver.findElements(prescriptionLineItemIds)
  const idPromises = idElements.map(element => element.getText())

  await driver.findElement(dispensePrescriptionAction).click()

  await driver.wait(
    until.elementsLocated(dispenseButton),
    fiveTimesDefaultWaitTimeout
  )

  return Promise.all(idPromises)
}
