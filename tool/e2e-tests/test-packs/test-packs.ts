import {ThenableWebDriver, until, WebElement} from "selenium-webdriver"
import {defaultWaitTimeout} from "../helpers"
import path from "path"

export async function loadTestPack1Examples(driver: ThenableWebDriver): Promise<void> {
  const testPackUpload = await getTestPackUpload(driver)
  uploadTestPack(testPackUpload, "homecare_all_types.xlsx")
  await loadPrescriptionsFromTestPack(driver)
}

export async function loadTestPack2Examples(driver: ThenableWebDriver): Promise<void> {
  const testPackUpload = await getTestPackUpload(driver)
  uploadTestPack(testPackUpload, "homecare_30_acute_nominated.xlsx")
  await loadPrescriptionsFromTestPack(driver)
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

async function loadPrescriptionsFromTestPack(driver: ThenableWebDriver) {
  await driver.findElement({xpath: "//*[text() = 'View']"}).click()
}
