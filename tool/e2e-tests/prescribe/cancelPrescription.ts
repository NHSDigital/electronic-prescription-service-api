import {By, ThenableWebDriver, until} from "selenium-webdriver"
import {driver} from "../live.test"
import {
  loadNonASCIIDosageInstructionsFHIRMessage,
  loadNonASCIINoteToDispenseFHIRMessage,
  loadNonASCIIPatientAdditionalInstructionsFHIRMessage,
  loadXMLTagDosageInstructionsFHIRMessage,
  loadXMLTagNotesToDispenseFHIRMessage,
  loadXMLTagPatientAdditionalInstructionsFHIRMessage
} from "../test-packs/test-packs"

import {
  checkApiResult,
  defaultWaitTimeout,
  finaliseWebAction,
  sendPrescriptionUserJourney
} from "../helpers"
import {cancelButton, cancelPrescriptionAction, cancelPrescriptionPageTitle} from "../locators"

describe("firefox", () => {
  test("can cancel prescription", async () => {
    await sendPrescriptionUserJourney(driver)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel prescription that has non ASCII chars in dosage instructions", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIDosageInstructionsFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel prescription that has non ASCII chars in note to dispense", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIINoteToDispenseFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel prescription that has non ASCII chars in additional instructions", async () => {
    await sendPrescriptionUserJourney(driver, loadNonASCIIPatientAdditionalInstructionsFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel Patient additional Instructions contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagPatientAdditionalInstructionsFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel Dosage Instructions contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagDosageInstructionsFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })

  test("can cancel Note to dispenser contains XML tag", async () => {
    await sendPrescriptionUserJourney(driver, loadXMLTagNotesToDispenseFHIRMessage)
    await cancelPrescriptionUserJourney(driver)
  })
})

async function cancelPrescriptionUserJourney(
  driver: ThenableWebDriver
): Promise<void> {
  await driver.findElement(cancelPrescriptionAction).click()
  await driver.wait(until.elementsLocated(cancelPrescriptionPageTitle), defaultWaitTimeout)
  const medicationToCancelRadios = await driver.findElements(By.name("cancellationMedication"))
  const firstMedicationToCancelRadio = medicationToCancelRadios[0]
  firstMedicationToCancelRadio.click()
  await driver.findElement(cancelButton).click()
  finaliseWebAction(driver, "CANCELLING PRESCRIPTION...")
  await checkApiResult(driver)
}
