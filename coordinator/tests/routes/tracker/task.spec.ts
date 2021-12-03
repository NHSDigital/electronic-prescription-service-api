import {
  filterBundleEntries,
  getValue,
  matchesQuery,
  QueryParam,
  ValidQuery
} from "../../../src/routes/tracker/task"
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
  [{[QueryParam.IDENTIFIER]: prescriptionId1}, true],
  [{[QueryParam.IDENTIFIER]: prescriptionId2}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId1}, true],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId2}, false],
  [{[QueryParam.PATIENT_IDENTIFIER]: nhsNumber1}, true],
  [{[QueryParam.PATIENT_IDENTIFIER]: nhsNumber2}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId1, [QueryParam.PATIENT_IDENTIFIER]: nhsNumber1}, true],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId2, [QueryParam.PATIENT_IDENTIFIER]: nhsNumber1}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId1, [QueryParam.PATIENT_IDENTIFIER]: nhsNumber2}, false]
]

test.each(taskCases)("matchesQuery returns expected result", (query: ValidQuery, expectedResult: boolean) => {
  const matches = matchesQuery(exampleTask1, query)
  expect(matches).toBe(expectedResult)
})

const bundleCases: Array<[ValidQuery, Array<fhir.Task>]> = [
  [{}, [exampleTask1, exampleTask2]],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId1}, [exampleTask1]],
  [{[QueryParam.FOCUS_IDENTIFIER]: prescriptionId2}, [exampleTask2]],
  [{[QueryParam.FOCUS_IDENTIFIER]: "Invalid"}, []]
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

const exampleQuery: ValidQuery = {
  [QueryParam.FOCUS_IDENTIFIER]: "18B064-A99968-4BCAA3",
  [QueryParam.PATIENT_IDENTIFIER]: "https://fhir.nhs.uk/Id/nhs-number|9449304289"
}

test("getValue returns correct result when value present and system not specified", () => {
  const value = getValue(exampleQuery, QueryParam.FOCUS_IDENTIFIER)
  expect(value).toEqual("18B064-A99968-4BCAA3")
})

test("getValue returns correct result when value present and system specified", () => {
  const value = getValue(exampleQuery, QueryParam.PATIENT_IDENTIFIER)
  expect(value).toEqual("9449304289")
})

test("getValue returns correct result when value not present", () => {
  const value = getValue(exampleQuery, QueryParam.IDENTIFIER)
  expect(value).toBeFalsy()
})
