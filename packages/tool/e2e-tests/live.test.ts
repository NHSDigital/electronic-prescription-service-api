import "path"
import {PathLike} from "fs"
import {writeFile, access, mkdir} from "node:fs/promises"
import _ from "lodash"

import "chromedriver"
import "geckodriver"
import {Builder, ThenableWebDriver} from "selenium-webdriver"
import * as chrome from "selenium-webdriver/chrome"
import {
  expect,
  beforeAll,
  beforeEach,
  afterEach
} from "@jest/globals"

import {EPSAT_HOME_URL, CHROME_BINARY_PATH, LOCAL_MODE} from "./helpers"

import * as login from "./auth/login.spec"
import * as logout from "./auth/logout.spec"

import * as cancelPrescription from "./prescribe/cancelPrescription.spec"
import * as editPrescription from "./prescribe/editPrescription.spec"
import * as prescriptionPagination from "./prescribe/prescriptionPagination.spec"
import * as sendPrescription from "./prescribe/sendPrescription.spec"
import * as sendPrescriptionsFromTestPack from "./prescribe/sendPrescriptionsFromTestPack.spec"
import * as sendRepeatPrescriptionsFromTestPack from "./prescribe/sendRepeatPrescriptionsFromTestPack.spec"

import * as amendDispense from "./dispense/amendDispense.spec"
import * as claimAmendPrescription from "./dispense/claimAmendPrescription.spec"
import * as claimPrescription from "./dispense/claimPrescription.spec"
import * as dispensePrescription from "./dispense/dispensePrescription.spec"
import * as releasePrescription from "./dispense/releasePrescription.spec"
import * as returnPrescription from "./dispense/returnPrescription.spec"
import * as withdrawPrescription from "./dispense/withdrawPrescription.spec"

import * as cancelState from "./end-state/canceledState.spec"
import * as claimedState from "./end-state/claimedState.spec"
import * as searchPrescription from "./tracker/searchPrescription.spec"
import * as validateFhirResource from "./validator/validateFhirResource.spec"

const testResultsDirectory = "test_results"

export let driver: ThenableWebDriver

async function dirExists(path: PathLike) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.console = require("console")
  const exist = await dirExists(testResultsDirectory)
  if (!exist) {
    await mkdir(testResultsDirectory, {recursive: true})
  }
  console.log(`Running test against ${EPSAT_HOME_URL}`)
})

beforeEach(async () => {
  console.log(`\n==================| ${expect.getState().currentTestName} |==================`)
  const options = buildChromeOptions()
  Object.defineProperty(global, "hasTestFailures", {
    value: false
  })
  driver = new Builder()
    .setChromeOptions(options)
    .forBrowser("chrome")
    .build()
})

afterEach(async () => {
  const hasTestFailures = _.get(global, "hasTestFailures", false)
  if (hasTestFailures) {
    const image = await driver.takeScreenshot()
    const filename = `${expect.getState().currentTestName}/${new Date().toISOString()}`.replace(/[^a-z0-9]/gi, "_")
    const filepath = `${testResultsDirectory}/${filename}.png`
    await writeFile(filepath, image, "base64")
    console.log("test failed")
    console.log(`saved screenshot to ${filepath}`)
  } else {
    console.log("test succeeded")
  }
  await driver.quit()
})

function buildChromeOptions() {
  const chromeOptions = new chrome.Options()
  if (LOCAL_MODE) {
    chromeOptions.setBinaryPath(CHROME_BINARY_PATH)
  }
  if (!LOCAL_MODE) {
    chromeOptions.addArguments("--headless")
  }
  return chromeOptions
}

// Unused export to keep the linter happy.
// The purpose of this file is to manage before and after
// hooks and run tests in between them from one
// place to avoid concurrency issues

export const tests = [
  login,
  logout,
  cancelPrescription,
  editPrescription,
  prescriptionPagination,
  sendPrescription,
  sendPrescriptionsFromTestPack,
  sendRepeatPrescriptionsFromTestPack,
  amendDispense,
  claimAmendPrescription,
  claimPrescription,
  dispensePrescription,
  releasePrescription,
  returnPrescription,
  withdrawPrescription,
  cancelState,
  claimedState,
  searchPrescription,
  validateFhirResource
]
