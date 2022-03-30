import {ThenableWebDriver, until, WebElement} from "selenium-webdriver"
import {defaultWaitTimeout} from "../helpers"
import path from "path"

export async function loadClinicalTestPack1Examples(driver: ThenableWebDriver): Promise<void> {
  const testPackUpload = await getTestPackUpload(driver)
  uploadTestPack(testPackUpload, "Full Prescriber Volume Pack.xlsx")
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
