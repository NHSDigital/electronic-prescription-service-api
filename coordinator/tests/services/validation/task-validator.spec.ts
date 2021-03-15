import * as fhir from "../../../src/models/fhir"
import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {verifyTask} from "../../../src/services/validation/task-validator"
import * as errors from "../../../src/models/errors/validation-errors"

describe("verifyTask returns errors", () => {
  const validReturnTask = TestResources.exampleReturnTask
  const validWithdrawTask = TestResources.exampleWithdrawTask
  let invalidReturnTask: fhir.Task
  let invalidWithdrawTask: fhir.Task

  beforeEach(() => {
    invalidReturnTask = clone(validReturnTask)
    invalidWithdrawTask = clone(validWithdrawTask)
  })

  test("rejects when resourceType not 'Task'", () => {
    const invalidTask = {...validReturnTask, resourceType: "bluh"}
    const returnedErrors = verifyTask(invalidTask as fhir.Task)
    expect(returnedErrors).toContainEqual(errors.createResourceTypeIssue("Task"))
  })

  test("rejects when intent not 'order'", () => {
    (invalidReturnTask as fhir.Task).intent = "bluh"
    const returnedErrors = verifyTask(invalidReturnTask as fhir.Task)
    expect(returnedErrors).toContainEqual(errors.createTaskIncorrectValueIssue("intent", "'order'"))
  })

  test("rejects when status not 'in-progress' or 'rejected'", () => {
    invalidReturnTask.status = "bluh"
    const returnedErrors = verifyTask(invalidReturnTask)
    expect(returnedErrors).toContainEqual(errors.createTaskIncorrectValueIssue("status", "'in-progress' or 'rejected'"))
  })

  test("rejects when status 'rejected' and reasonCode system invalid", () => {
    const expectedSystem = invalidWithdrawTask.reasonCode.coding[0].system
    invalidWithdrawTask.reasonCode.coding[0].system = "bluh"
    const returnedErrors = verifyTask(invalidWithdrawTask)
    expect(returnedErrors).toContainEqual(errors.createTaskCodingSystemIssue("reasonCode", expectedSystem))
  })

  test("rejects when status 'in-progress' and reasonCode system invalid", () => {
    const expectedSystem = invalidReturnTask.reasonCode.coding[0].system
    invalidReturnTask.reasonCode.coding[0].system = "bluh"
    const returnedErrors = verifyTask(invalidReturnTask)
    expect(returnedErrors).toContainEqual(errors.createTaskCodingSystemIssue("reasonCode", expectedSystem))
  })

  test("rejects when status 'in-progress' and code is not present invalid", () => {
    delete invalidReturnTask.code
    const returnedErrors = verifyTask(invalidReturnTask as fhir.Task)
    expect(returnedErrors).toHaveLength(1)
    expect(returnedErrors[0].diagnostics).toBe("Task.code is requred when task.status='in-progress'.")
  })
})
