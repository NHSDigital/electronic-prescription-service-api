import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  defaultWaitTimeout,
  finaliseWebAction,
  fiveTimesDefaultWaitTimeout,
  sendPrescriptionUserJourney
} from "../helpers"
import {
  searchButton,
  searchDetailsPageTitle,
  searchPageTitle,
  searchResultsPageTitle,
  searchViewDetailsButton,
  viewPrescriptionAction
} from "../locators"

describe("firefox", () => {
  test("can search for prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await searchForPrescriptionUserJourney(driver, prescriptionId)
  })
})

async function searchForPrescriptionUserJourney(
  driver: ThenableWebDriver,
  prescriptionId: string
): Promise<void> {
  await driver.findElement(viewPrescriptionAction).click()
  await driver.wait(until.elementsLocated(searchPageTitle), defaultWaitTimeout)
  await driver.findElement(searchButton).click()
  finaliseWebAction(driver, "SEARCHING FOR PRESCRIPTION...")
  await driver.wait(until.elementsLocated(searchResultsPageTitle), fiveTimesDefaultWaitTimeout)
  const table = await driver.findElement(By.className("nhsuk-table-responsive"))
  const prescriptionIdEntry = By.xpath(`//*[text() = '${prescriptionId}']`)
  await table.findElement(prescriptionIdEntry)
  finaliseWebAction(driver, "FOUND PRESCRIPTION")
  await driver.findElement(searchViewDetailsButton).click()
  await driver.wait(until.elementsLocated(searchDetailsPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "VIEWED FOUND PRESCRIPTION DETAILS")
}
