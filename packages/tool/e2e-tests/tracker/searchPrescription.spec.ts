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
  (await getElement(driver, homeNavLink)).click();
  await driver.wait(until.elementsLocated(homePageTitle), defaultWaitTimeout);
  (await getElement(driver, searchPrescriptionsLink)).click();
  await driver.wait(until.elementsLocated(searchPageTitle), defaultWaitTimeout);
  (await getElement(driver, By.id("prescriptionId"))).sendKeys(prescriptionId);

  (await getElement(driver, searchButton)).click();
  finaliseWebAction(driver, "SEARCHING FOR PRESCRIPTION...")
  await driver.wait(until.elementsLocated(By.className("nhsuk-table")), fiveTimesDefaultWaitTimeout)
  const table = (await getElement(driver, By.className("nhsuk-table")))

  const prescriptionIdEntry = By.xpath(`//*[text() = '${prescriptionId}']`)
  await table.findElement(prescriptionIdEntry)
  finaliseWebAction(driver, "FOUND PRESCRIPTION");
  (await getElement(driver, searchViewDetailsButton)).click()
  await driver.wait(until.elementsLocated(searchDetailsPageTitle), defaultWaitTimeout)
  finaliseWebAction(driver, "VIEWED FOUND PRESCRIPTION DETAILS")
}
