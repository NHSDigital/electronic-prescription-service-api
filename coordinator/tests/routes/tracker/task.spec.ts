import {
  filterBundleEntries,
  matchesQuery,
  QueryParam,
  ValidQuery
} from "../../../src/routes/tracker/task"
import {fhir} from "@models"

const task: fhir.Task = {
  resourceType: "Task",
  identifier: [{
    system: "https://tools.ietf.org/html/rfc4122",
    value: "8698b467-5cbc-429b-9a1c-9e707f02907d"
  }],
  status: fhir.TaskStatus.IN_PROGRESS,
  focus: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: "CCAD24-A99968-464724"
    }
  },
  intent: fhir.TaskIntent.ORDER,
  for: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/nhs-number",
      value: "9449304106"
    }
  },
  authoredOn: "2021-11-02"
}

const cases: Array<[ValidQuery, boolean]> = [
  [{[QueryParam.IDENTIFIER]: "CCAD24-A99968-464724"}, true],
  [{[QueryParam.IDENTIFIER]: "003D4D-A99968-4C5AAJ"}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: "CCAD24-A99968-464724"}, true],
  [{[QueryParam.FOCUS_IDENTIFIER]: "003D4D-A99968-4C5AAJ"}, false],
  [{[QueryParam.PATIENT_IDENTIFIER]: "9449304106"}, true],
  [{[QueryParam.PATIENT_IDENTIFIER]: "9449304130"}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: "CCAD24-A99968-464724", [QueryParam.PATIENT_IDENTIFIER]: "9449304106"}, true],
  [{[QueryParam.FOCUS_IDENTIFIER]: "003D4D-A99968-4C5AAJ", [QueryParam.PATIENT_IDENTIFIER]: "9449304106"}, false],
  [{[QueryParam.FOCUS_IDENTIFIER]: "CCAD24-A99968-464724", [QueryParam.PATIENT_IDENTIFIER]: "9449304130"}, false]
]

test.each(cases)("matchesQuery returns expected result", (query: ValidQuery, expectedResult: boolean) => {
  const matches = matchesQuery(task, query)
  expect(matches).toBe(expectedResult)
})

test("filterBundleEntries returns expected result", () => {
  const task2: fhir.Task = {
    ...task,
    focus: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/prescription-order-number",
        value: "003D4D-A99968-4C5AAJ"
      }
    }
  }
  const bundle: fhir.Bundle = {
    resourceType: "Bundle",
    entry: [
      {
        resource: task
      },
      {
        resource: task2
      }
    ]
  }
  filterBundleEntries(bundle, {[QueryParam.IDENTIFIER]: "CCAD24-A99968-464724"})
  expect(bundle.entry).toHaveLength(1)
  expect(bundle.entry[0].resource).toEqual(task)
})
