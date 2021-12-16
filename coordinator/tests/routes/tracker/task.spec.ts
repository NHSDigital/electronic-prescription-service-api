import {filterBundleEntries, getValue, matchesQuery, testDate, ValidQuery} from "../../../src/routes/tracker/task"
import {fetcher, fhir} from "@models"

const exampleTasks = fetcher.taskExamples.map(example => example.request)

const exampleTask1 = exampleTasks[0]
const prescriptionId1 = exampleTask1.focus.identifier.value
const nhsNumber1 = exampleTask1.for.identifier.value

const exampleTask2 = exampleTasks.find(task =>
  task.focus.identifier.value !== prescriptionId1
  && task.for.identifier.value !== nhsNumber1
)
const prescriptionId2 = exampleTask2.focus.identifier.value
const nhsNumber2 = exampleTask2.for.identifier.value

const taskCases: Array<[ValidQuery, boolean]> = [
  [{"identifier": prescriptionId1}, true],
  [{"identifier": prescriptionId2}, false],
  [{"focus:identifier": prescriptionId1}, true],
  [{"focus:identifier": prescriptionId2}, false],
  [{"patient:identifier": nhsNumber1}, true],
  [{"patient:identifier": nhsNumber2}, false],
  [{"focus:identifier": prescriptionId1, "patient:identifier": nhsNumber1}, true],
  [{"focus:identifier": prescriptionId2, "patient:identifier": nhsNumber1}, false],
  [{"focus:identifier": prescriptionId1, "patient:identifier": nhsNumber2}, false]
]

test.each(taskCases)("matchesQuery returns expected result", (query: ValidQuery, expectedResult: boolean) => {
  const matches = matchesQuery(exampleTask1, query)
  expect(matches).toBe(expectedResult)
})

const bundleCases: Array<[ValidQuery, Array<fhir.Task>]> = [
  [{}, [exampleTask1, exampleTask2]],
  [{"focus:identifier": prescriptionId1}, [exampleTask1]],
  [{"focus:identifier": prescriptionId2}, [exampleTask2]],
  [{"focus:identifier": "Invalid"}, []]
]

test.each(bundleCases)(
  "filterBundleEntries returns expected result",
  (query: ValidQuery, expectedMatches: Array<fhir.Task>) => {
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      entry: [{resource: exampleTask1}, {resource: exampleTask2}],
      total: 2
    }
    filterBundleEntries(bundle, query)
    const resources = bundle.entry.map(entry => entry.resource)
    expect(resources).toEqual(expectedMatches)
    expect(bundle.total).toEqual(expectedMatches.length)
  }
)

test("getValue returns correct result when value present and system not specified", () => {
  const value = getValue("18B064-A99968-4BCAA3")
  expect(value).toEqual("18B064-A99968-4BCAA3")
})

test("getValue returns correct result when value present and system specified", () => {
  const value = getValue("https://fhir.nhs.uk/Id/nhs-number|9449304289")
  expect(value).toEqual("9449304289")
})

test("getValue returns correct result when value not present", () => {
  const value = getValue(undefined)
  expect(value).toBeFalsy()
})

describe("testDate", () => {
  test("returns true when comparator is eq and actual datetime is on the same day as search date", () => {
    expect(testDate("2021-12-08T14:25:00.000Z", "eq2021-12-08")).toBeTruthy()
  })

  test("returns false when comparator is eq and actual datetime is on a day before the search date", () => {
    expect(testDate("2021-12-07T14:25:00.000Z", "eq2021-12-08")).toBeFalsy()
  })

  test("returns false when comparator is eq and actual datetime is on a day after the search date", () => {
    expect(testDate("2021-12-09T14:25:00.000Z", "eq2021-12-08")).toBeFalsy()
  })

  test("returns true when comparator is le and actual datetime is on the same day as search date", () => {
    expect(testDate("2021-12-08T14:25:00.000Z", "le2021-12-08")).toBeTruthy()
  })

  test("returns true when comparator is le and actual datetime is on a day before the search date", () => {
    expect(testDate("2021-12-07T14:25:00.000Z", "le2021-12-08")).toBeTruthy()
  })

  test("returns false when comparator is le and actual datetime is on a day after the search date", () => {
    expect(testDate("2021-12-09T14:25:00.000Z", "le2021-12-08")).toBeFalsy()
  })

  test("returns true when comparator is ge and actual datetime is on the same day as search date", () => {
    expect(testDate("2021-12-08T14:25:00.000Z", "ge2021-12-08")).toBeTruthy()
  })

  test("returns false when comparator is ge and actual datetime is on a day before the search date", () => {
    expect(testDate("2021-12-07T14:25:00.000Z", "ge2021-12-08")).toBeFalsy()
  })

  test("returns true when comparator is ge and actual datetime is on a day after the search date", () => {
    expect(testDate("2021-12-09T14:25:00.000Z", "ge2021-12-08")).toBeTruthy()
  })

  test("throws when comparator is something other than eq, le and ge", () => {
    expect(() => testDate("2021-12-09T14:25:00.000Z", "ne2021-12-08")).toThrow()
  })
})
