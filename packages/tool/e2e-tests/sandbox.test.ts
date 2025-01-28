import "chromedriver"
import "geckodriver"
import {Builder, ThenableWebDriver} from "selenium-webdriver"
import * as firefox from "selenium-webdriver/firefox"
import {EPSAT_HOME_URL, FIREFOX_BINARY_PATH, LOCAL_MODE} from "./helpers"
import * as doseToText from "./dose-to-text/doseToText.spec"
import _ from "lodash"
import "path"

const testResultsDirectory = "test_results"

import {writeFile, access, mkdir} from "node:fs/promises"
import {PathLike} from "fs"

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

beforeEach(async() => {
  console.log(`\n==================| ${expect.getState().currentTestName} |==================`)
  const options = buildFirefoxOptions()
  Object.defineProperty(global, "hasTestFailures", {
    value: false
  })
  driver = new Builder()
    .setFirefoxOptions(options)
    .forBrowser("firefox")
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
  await driver.close()
})

function buildFirefoxOptions() {
  const firefoxOptions = new firefox.Options()
  if (LOCAL_MODE) {
    firefoxOptions.setBinary(FIREFOX_BINARY_PATH)
  }
  if (!LOCAL_MODE) {
    firefoxOptions.addArguments("--headless")
  }
  return firefoxOptions
}

// Unused export to keep the linter happy.
// The purpose of this file is to manage before and after
// hooks and run tests in between them from one
// place to avoid concurrency issues

export const tests = [
  doseToText
]
