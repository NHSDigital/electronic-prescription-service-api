/* eslint-disable no-undef */
import * as fetchers from "./fetchers"
import {Case} from "./cases/case"

describe("process", () => {
  test("all examples", () => {
    printCases(fetchers.processExamples)
  })

  test("errors", () => {
    printCases(fetchers.processExamples.filter(processExample => !processExample.isSuccess))
  })
})

describe("convert", () => {
  test("all examples", () => {
    printCases(fetchers.convertExamples)
  })
})

function printCases<T extends Case>(cases: Array<T>) {
  let str = ""
  cases.forEach(Case => {
    str += `Prescription - ${Case.description} has status ${Case.statusText}\n`
  })
  console.log(str)
}
