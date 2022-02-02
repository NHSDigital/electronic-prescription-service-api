import "chromedriver"
import "geckodriver"
import {ThenableWebDriver} from "selenium-webdriver"
import {driver} from "./all.test"
import {EPSAT_HOME_URL, logDiagnostics, performCreatePrescriptionUserJourney} from "./helpers"

console.log(`Running test against ${EPSAT_HOME_URL}`)

describe("firefox", () => {
  test("can create prescription", async () => {
    await doTest(driver)
  })
})

async function doTest(driver: ThenableWebDriver) {
  const prescriptionId = await performCreatePrescriptionUserJourney(driver)
  expect(prescriptionId).toBeTruthy()
}
