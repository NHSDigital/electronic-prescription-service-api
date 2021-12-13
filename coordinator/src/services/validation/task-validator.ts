import {fhir, validationErrors as errors} from "@models"
import {getCodeableConceptCodingForSystem, getCodingForSystemOrNull} from "../translation/common"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"

export function verifyTask(task: fhir.Task, scope: string, accessTokenOds: string): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  if (task.resourceType !== "Task") {
    return [errors.createResourceTypeIssue("Task")]
  }

  const permissionErrors = validatePermittedAttendedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  if (task.intent !== fhir.TaskIntent.ORDER) {
    validationErrors.push(errors.createTaskIncorrectValueIssue("intent", fhir.TaskIntent.ORDER))
  }

  const statusSpecificErrors = performStatusSpecificValidation(task)
  validationErrors.push(...statusSpecificErrors)

  if (task.owner) {
    const bodyOrg = task.owner.identifier.value
    if (bodyOrg !== accessTokenOds) {
      console.warn(
        `Organization details do not match in request accessToken (${accessTokenOds}) and request body (${bodyOrg}).`
      )
    }
  }

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
  const withdrawSpecificErrors: Array<fhir.OperationOutcomeIssue> = []

  if (!task.code) {
    withdrawSpecificErrors.push({
      severity: "error",
      code: fhir.IssueCodes.VALUE,
      diagnostics: "Task.code is required when Task.status is 'in-progress'.",
      expression: [`Task.code`]
    })
  } else {
    const typeCoding = getCodeableConceptCodingForSystem(
      [task.code],
      "http://hl7.org/fhir/CodeSystem/task-code",
      "Task.code"
    )
    if (typeCoding.code !== "abort") {
      withdrawSpecificErrors.push(errors.createTaskIncorrectValueIssue("code.coding.code", "abort"))
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
  return getCodingForSystemOrNull(task.statusReason?.coding, system, "Task.statusReason")
    ? []
    : [errors.createTaskCodingSystemIssue("reasonCode", system)]
}
