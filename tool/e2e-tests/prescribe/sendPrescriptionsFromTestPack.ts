import {ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../all.test"
import path from "path"
import {checkMyPrescriptions, defaultWaitTimeout, sendPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  test("can send prescriptions from test pack", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadTestPackExamples)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })
})

async function loadTestPackExamples(driver: ThenableWebDriver) {
  const customRadioSelector = {xpath: "//*[@value = 'custom']"}
  await driver.wait(until.elementsLocated(customRadioSelector), defaultWaitTimeout)
  const customRadio = await driver.findElement(customRadioSelector)
  await customRadio.click()
  const fileUploads = {xpath: "//*[@type = 'file']"}
  await driver.wait(until.elementsLocated(fileUploads), defaultWaitTimeout)
  const testPackUpload = await (await driver.findElements(fileUploads))[0]
  testPackUpload.sendKeys(path.join(__dirname, "../", "test-packs", "homecare_all_types.xlsx"))
  await driver.findElement({xpath: "//*[text() = 'View']"}).click()
}
