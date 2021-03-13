import * as fhir from "../../models/fhir"
import {TaskIntent, TaskStatus} from "../../models/fhir"
import * as errors from "../../models/errors/validation-errors"
import {getCodingForSystemOrNull} from "../translation/common"

export function verifyTask(task: fhir.Task): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  if (task.resourceType !== "Task") {
    validationErrors.push(errors.createResourceTypeIssue("Task"))
  }

  if (task.intent != TaskIntent.ORDER) {
    validationErrors.push(errors.createTaskIncorrectValueIssue("intent", TaskIntent.ORDER))
  }

  if (task.status === TaskStatus.IN_PROGRESS) {
    if (!task.code) {
      validationErrors.push({
        severity: "error",
        code: "value",
        diagnostics: "Task.code is required when Task.status is 'in-progress'.",
        expression: [`Task.code`]
      } as fhir.OperationOutcomeIssue)
      validationErrors.push(
        ...validateReasonCode(task, "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason")
      )
    }
  } else if (task.status === TaskStatus.REJECTED) {
    validationErrors.push(
      ...validateReasonCode(task, "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason")
    )
  } else {
    validationErrors.push(errors.createTaskIncorrectValueIssue("status", TaskStatus.IN_PROGRESS, TaskStatus.REJECTED))
  }

  return validationErrors
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
