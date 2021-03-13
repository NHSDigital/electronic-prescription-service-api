import * as fhir from "../../models/fhir"
import {TaskIntent, TaskStatus} from "../../models/fhir"
import * as errors from "../../models/errors/validation-errors"
import {getCodeableConceptCodingForSystem, getCodingForSystemOrNull} from "../translation/common"
import {createTaskIncorrectValueIssue} from "../../models/errors/validation-errors"

export function verifyTask(task: fhir.Task): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  if (task.resourceType !== "Task") {
    validationErrors.push(errors.createResourceTypeIssue("Task"))
  }

  if (task.intent != TaskIntent.ORDER) {
    validationErrors.push(errors.createTaskIncorrectValueIssue("intent", TaskIntent.ORDER))
  }

  if (task.status === TaskStatus.IN_PROGRESS) {
    const withdrawSpecificErrors = validateWithdraw(task)
    validationErrors.push(...withdrawSpecificErrors)
  } else if (task.status === TaskStatus.REJECTED) {
    const returnSpecificErrors = validateReturn(task)
    validationErrors.push(...returnSpecificErrors)
  } else {
    validationErrors.push(errors.createTaskIncorrectValueIssue("status", TaskStatus.IN_PROGRESS, TaskStatus.REJECTED))
  }

  return validationErrors
}

function validateWithdraw(task: fhir.Task) {
  const withdrawSpecificErrors = []
  if (!task.code) {
    withdrawSpecificErrors.push({
      severity: "error",
      code: "value",
      diagnostics: "Task.code is required when Task.status is 'in-progress'.",
      expression: [`Task.code`]
    } as fhir.OperationOutcomeIssue)
  } else {
    const typeCoding = getCodeableConceptCodingForSystem(
      [task.code],
      "http://hl7.org/fhir/CodeSystem/task-code",
      "Task.code"
    )
    if (typeCoding.code !== "abort") {
      withdrawSpecificErrors.push(createTaskIncorrectValueIssue("code.coding.code", "abort"))
    }
  }
  withdrawSpecificErrors.push(
    ...validateReasonCode(task, "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason")
  )
  return withdrawSpecificErrors
}

function validateReturn(task: fhir.Task) {
  const returnSpecificErrors = []
  returnSpecificErrors.push(
    ...validateReasonCode(task, "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason")
  )
  return returnSpecificErrors
}

function validateReasonCode(task: fhir.Task, system: string): Array<fhir.OperationOutcomeIssue> {
  const validSystemCode = getCodingForSystemOrNull(
    task.reasonCode.coding,
    system,
    `Task.reasonCode`
  )
  if (!validSystemCode) {
    return [errors.createTaskCodingSystemIssue("reasonCode", system)]
  }
  return []
}
