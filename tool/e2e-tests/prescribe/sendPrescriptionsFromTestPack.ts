import {ThenableWebDriver, until, WebElement} from "selenium-webdriver"
import {driver} from "../all.test"
import path from "path"
import {checkMyPrescriptions, defaultWaitTimeout, sendPrescriptionUserJourney} from "../helpers"

describe("firefox", () => {
  // todo: unpick validation rule changes which have made a breaking change here
  test.skip("can send prescriptions from test pack 1", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadTestPack1Examples)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })

  test("can send prescriptions from test pack 2", async () => {
    const prescriptionId = await sendPrescriptionUserJourney(driver, loadTestPack2Examples)
    expect(prescriptionId).toBeTruthy()
    await checkMyPrescriptions(driver, "Sent Prescriptions", prescriptionId)
  })
})

async function loadTestPack1Examples(driver: ThenableWebDriver) {
  const testPackUpload = await getTestPackUpload(driver)
  uploadTestPack(testPackUpload, "homecare_all_types.xlsx")
  await sendPrescriptionsFromTestPack(driver)
}

async function loadTestPack2Examples(driver: ThenableWebDriver) {
  const testPackUpload = await getTestPackUpload(driver)
  uploadTestPack(testPackUpload, "homecare_30_acute_nominated.xlsx")
  await sendPrescriptionsFromTestPack(driver)
}

async function getTestPackUpload(driver: ThenableWebDriver) {
  const customRadioSelector = {xpath: "//*[@value = 'custom']"}
  await driver.wait(until.elementsLocated(customRadioSelector), defaultWaitTimeout)
  const customRadio = await driver.findElement(customRadioSelector)
  await customRadio.click()
  const fileUploads = {xpath: "//*[@type = 'file']"}
  await driver.wait(until.elementsLocated(fileUploads), defaultWaitTimeout)
  const testPackUpload = await (await driver.findElements(fileUploads))[0]
  return testPackUpload
}

function uploadTestPack(testPackUpload: WebElement, testPackName: string) {
  testPackUpload.sendKeys(path.join(__dirname, "../", "test-packs", testPackName))
}

async function sendPrescriptionsFromTestPack(driver: ThenableWebDriver) {
  await driver.findElement({xpath: "//*[text() = 'View']"}).click()
}
