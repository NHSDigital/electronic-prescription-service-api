import "chromedriver"
import "geckodriver"
import {Builder, ThenableWebDriver} from "selenium-webdriver"
import * as firefox from "selenium-webdriver/firefox"
import {EPSAT_HOME_URL, LOCAL_MODE} from "./helpers"
// import * as sendPrescription from "./prescribe/sendPrescription"
// import * as cancelPrescription from "./prescribe/cancelPrescription"
// import * as releasePrescription from "./dispense/releasePrescription"
import * as returnPrescription from "./dispense/returnPrescription"
// import * as dispensePrescription from "./dispense/dispensePrescription"
// import * as claimPrescription from "./dispense/claimPrescription"
// import * as searchPrescription from "./tracker/searchPrescription"
// import * as validateFhirResource from "./validator/validateFhirResource"

export let driver: ThenableWebDriver

beforeAll(() => console.log(`Running test against ${EPSAT_HOME_URL}`))

beforeEach(async() => {
  const options = buildFirefoxOptions()
  driver = new Builder()
    .setFirefoxOptions(options)
    .forBrowser("firefox")
    .build()
})

afterEach(async() => {
  await driver.close()
})

function buildFirefoxOptions() {
  const firefoxOptions = new firefox.Options()
  if (LOCAL_MODE) {
    firefoxOptions.setBinary(process.env.FIREFOX_BINARY_PATH)
  }
  if (!LOCAL_MODE) {
    firefoxOptions.headless()
  }
  return firefoxOptions
}

// Unused export to keep the linter happy.
// The purpose of this file is to manage before and after
// hooks and run tests in between them from one
// place to avoid concurrency issues
export const tests = [
  // sendPrescription,
  // cancelPrescription,
  // releasePrescription,
  returnPrescription,
  // dispensePrescription,
  // claimPrescription,
  // searchPrescription,
  // validateFhirResource
]
