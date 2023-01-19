import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  defaultWaitTimeout,
  finaliseWebAction,
  fiveTimesDefaultWaitTimeout,
  sendPrescriptionUserJourney
} from "../helpers"
import {
  homeNavLink,
  homePageTitle,
  searchButton,
  searchDetailsPageTitle,
  searchPageTitle,
  searchPrescriptionsLink,
  searchViewDetailsButton
} from "../locators"

describe("firefox", () => {
  test("can search for prescription", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver)
    expect(prescriptionId).toBeTruthy()
    await searchForPrescriptionUserJourney(driver, prescriptionId)
  })
})

export async function searchForPrescriptionUserJourney(
  driver: ThenableWebDriver,
  prescriptionId: string
): Promise<void> {
  await driver.findElement(homeNavLink).click()
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  await driver.findElement(searchPrescriptionsLink).click()
  await driver.wait(until.elementsLocated(searchPageTitle), defaultWaitTimeout)
  await driver.findElement(By.id("prescriptionId")).sendKeys(prescriptionId)
  await driver.findElement(searchButton).click()
  finaliseWebAction(driver, "SEARCHING FOR PRESCRIPTION...")
  await driver.wait(until.elementsLocated(By.className("nhsuk-table")), fiveTimesDefaultWaitTimeout)
  const table = await driver.findElement(By.className("nhsuk-table"))
  const prescriptionIdEntry = By.xpath(`//*[text() = '${prescriptionId}']`)
  await table.findElement(prescriptionIdEntry)
  finaliseWebAction(driver, "FOUND PRESCRIPTION")
  await driver.findElement(searchViewDetailsButton).click()
  await driver.wait(until.elementsLocated(searchDetailsPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "VIEWED FOUND PRESCRIPTION DETAILS")
}
