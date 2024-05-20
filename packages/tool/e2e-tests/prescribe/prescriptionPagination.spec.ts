import {By, ThenableWebDriver, WebElement} from "selenium-webdriver"
import {driver} from "../live.test"
import {createPrescription, loadTestData, loginViaSimulatedAuthSmartcardUser} from "../helpers"
import * as fileInfoFactory from "../file-upload-info/upload-info/Test-pack-info"

describe("firefox", () => {
  test("can navigate through paginated prescription summaries", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    await createPrescription(driver)
    await loadTestData(driver, fileInfoFactory.getSupplierTestPackInfo())
    let paginationItemElements = await driver.findElements(By.className("pagination-item"))
    const startingPageElement = paginationItemElements[1]
    await checkPageIsShowingCurrentPrescription(driver, startingPageElement)

    let nextPageElement = paginationItemElements[2]
    await loadTheNextPrescription(driver, nextPageElement)
    // wait 2 seconds for page to finish rendering
    await new Promise(r => setTimeout(r, 2000))

    // pagniation has refreshed the dom, re-find elements for pagination so they're not stale
    paginationItemElements = await driver.findElements(By.className("pagination-item"))
    nextPageElement = paginationItemElements[2]

    await checkPageIsShowingNextPrescription(driver, nextPageElement)
  })
})

async function checkPageIsShowingCurrentPrescription(driver: ThenableWebDriver, startingPageElement: WebElement) {
  expect((await startingPageElement.getAttribute("class")).split(" ").indexOf("selected") >= 0).toBeTruthy()
}

async function loadTheNextPrescription(driver: ThenableWebDriver, nextPageElement: WebElement) {
  await nextPageElement.click()
}

async function checkPageIsShowingNextPrescription(driver: ThenableWebDriver, nextPageElement: WebElement) {
  expect((await nextPageElement.getAttribute("class")).split(" ").indexOf("selected") >= 0).toBeTruthy()
}
