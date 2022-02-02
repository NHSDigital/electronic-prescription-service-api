import {Builder, ThenableWebDriver} from "selenium-webdriver"
import * as firefox from "selenium-webdriver/firefox"
import * as createPrescription from "./createPrescription"
import * as cancelPrescription from "./cancelPrescription"

const LOCAL_MODE = Boolean(process.env.LOCAL_MODE)

export let driver: ThenableWebDriver

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
  createPrescription,
  cancelPrescription
]
