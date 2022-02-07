import {Key, until} from "selenium-webdriver"
import {driver} from "../all.test"
import {createPrescription, loginViaSimulatedAuthSmartcardUser, tenTimesDefaultWaitTimeout} from "../helpers"
import {sendPageTitle} from "../locators"
import {loadTestPack2Examples} from "../test-packs/test-packs"

describe("firefox", () => {
  test("can navigate through paginated prescription summaries", async () => {
    await loginViaSimulatedAuthSmartcardUser(driver)
    await createPrescription(driver)
    await loadTestPack2Examples(driver)
    await driver.wait(until.elementsLocated(sendPageTitle), tenTimesDefaultWaitTimeout)

    const startingPrescriptionId = await getCurrentPrescriptionId()
    const nextPrescriptionId = await getNextPrescriptionId()
    await checkPageIsShowingCurrentPrescription(startingPrescriptionId)
    await loadTheNextPrescription()
    await checkPageIsShowingNextPrescription(nextPrescriptionId)
    const previousPrescriptionId = await getPreviousPrescriptionId()
    await loadThePreviousPrescription()
    await checkPageIsShowingThePreviousPrescription(previousPrescriptionId)
    checkPreviousPrescriptionIsTheStartingPrescription(previousPrescriptionId, startingPrescriptionId)
  })
})

async function getCurrentPrescriptionId() {
  return await (await driver.manage().getCookie("Current-Prescription-Id")).value
}

async function getNextPrescriptionId() {
  return await (await driver.manage().getCookie("Next-Prescription-Id")).value
}

async function checkPageIsShowingCurrentPrescription(startingPrescriptionId: string) {
  expect(await driver.getCurrentUrl()).toContain(`prescribe/edit?prescription_id=${encodeURIComponent(startingPrescriptionId)}`)
}

async function loadTheNextPrescription() {
  await driver.actions({async: true}).sendKeys(Key.ARROW_RIGHT).perform()
}

async function checkPageIsShowingNextPrescription(nextPrescriptionId: string) {
  await driver.wait(until.urlContains(`prescribe/edit?prescription_id=${encodeURIComponent(nextPrescriptionId)}`))
}

async function getPreviousPrescriptionId() {
  return await (await driver.manage().getCookie("Previous-Prescription-Id")).value
}

async function loadThePreviousPrescription() {
  await driver.actions({async: true}).sendKeys(Key.ARROW_LEFT).perform()
}

async function checkPageIsShowingThePreviousPrescription(previousPrescriptionId: string) {
  await driver.wait(until.urlContains(`prescribe/edit?prescription_id=${encodeURIComponent(previousPrescriptionId)}`))
}

function checkPreviousPrescriptionIsTheStartingPrescription(previousPrescriptionId: string, startingPrescriptionId: string) {
  expect(previousPrescriptionId).toEqual(startingPrescriptionId)
}
