import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {
  defaultWaitTimeout,
  sendPrescriptionUserJourney
} from "../helpers"

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
  await driver.findElement(By.linkText("View prescription")).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Search for a Prescription']"}), defaultWaitTimeout)

  await driver.findElement({xpath: "//*[text() = 'Search']"}).click()

  await driver.wait(until.elementsLocated({xpath: "//*[text() = 'Search Results']"}), defaultWaitTimeout)
  const table = await driver.findElement(By.className("nhsuk-table-responsive"))

  expect(await table.findElement({xpath: `//*[text() = '${prescriptionId}']`})).toBeTruthy()
}
