import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  defaultWaitTimeout,
  finaliseWebAction,
  fiveTimesDefaultWaitTimeout,
  getElement,
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
  await (await getElement(driver, homeNavLink)).click()
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout)
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000))

  await (await getElement(driver, searchPrescriptionsLink)).click()
  await driver.wait(until.elementsLocated(searchPageTitle), defaultWaitTimeout)
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000))

  await (await getElement(driver, By.id("prescriptionId"))).sendKeys(prescriptionId)
  // wait 2 seconds for keys to complete
  await new Promise(r => setTimeout(r, 2000))

  await (await getElement(driver, searchButton)).click()
  finaliseWebAction(driver, "SEARCHING FOR PRESCRIPTION...")
  await driver.wait(until.elementsLocated(By.className("nhsuk-table")), fiveTimesDefaultWaitTimeout)
  // wait 2 seconds for page to finish rendering
  await new Promise(r => setTimeout(r, 2000))

  const table = (await getElement(driver, By.className("nhsuk-table")))

  const prescriptionIdEntry = By.xpath(`//*[text() = '${prescriptionId}']`)
  await table.findElement(prescriptionIdEntry)
  finaliseWebAction(driver, "FOUND PRESCRIPTION")
  await (await getElement(driver, searchViewDetailsButton)).click()
  await driver.wait(until.elementsLocated(searchDetailsPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "VIEWED FOUND PRESCRIPTION DETAILS")
}
