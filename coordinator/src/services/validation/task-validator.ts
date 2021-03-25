import {fhir} from "@models"
import * as errors from "../../models/errors/validation-errors"
import {getCodeableConceptCodingForSystem, getCodingForSystemOrNull} from "../translation/common"
import {createTaskIncorrectValueIssue} from "../../models/errors/validation-errors"

export function verifyTask(task: fhir.Task): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  if (task.resourceType !== "Task") {
    validationErrors.push(errors.createResourceTypeIssue("Task"))
  }

  if (task.intent != fhir.TaskIntent.ORDER) {
    validationErrors.push(errors.createTaskIncorrectValueIssue("intent", fhir.TaskIntent.ORDER))
  }

  const statusSpecificErrors = performStatusSpecificValidation(task)
  validationErrors.push(...statusSpecificErrors)

  return validationErrors
}

function performStatusSpecificValidation(task: fhir.Task): Array<fhir.OperationOutcomeIssue> {
  switch (task.status) {
    case fhir.TaskStatus.IN_PROGRESS:
      return validateWithdraw(task)
    case fhir.TaskStatus.REJECTED:
      return validateReturn(task)
    default:
      return [errors.createTaskIncorrectValueIssue("status", fhir.TaskStatus.IN_PROGRESS, fhir.TaskStatus.REJECTED)]
  }
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
  return getCodingForSystemOrNull(task.reasonCode?.coding, system, "Task.reasonCode")
    ? []
    : [errors.createTaskCodingSystemIssue("reasonCode", system)]
}
