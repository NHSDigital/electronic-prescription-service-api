import * as fhir from "../../models/fhir"
import * as errors from "../../models/errors/validation-errors"
import {getCodingForSystemOrNull} from "../translation/common"

export function verifyTask(task: fhir.Task): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []

  if (task.resourceType !== "Task") {
    validationErrors.push(errors.createResourceTypeIssue("Task"))
  }

  if(task.intent != "order") {
    validationErrors.push(errors.createTaskIncorrectValueIssue("intent", "'order'"))
  }

  if(task.status === "in-progress") {
    if(!task.code){
      validationErrors.push({
        severity: "error",
        code: "value",
        diagnostics: "Task.code is requred when task.status='in-progress'.",
        expression: [`Task.code`]
      } as fhir.OperationOutcomeIssue)
    }
    validationErrors.push(...checkValidSystem(
      task,
      "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason"
    ))
  } else if (task.status === "rejected") {
    validationErrors.push(...checkValidSystem(
      task,
      "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason"
    ))
  } else {
    validationErrors.push(errors.createTaskIncorrectValueIssue("status", "'in-progress' or 'rejected'"))
  }

  return validationErrors
}

function checkValidSystem(task: fhir.Task, system: string): Array<fhir.OperationOutcomeIssue>{
  return getCodingForSystemOrNull(task.reasonCode.coding, system, "Task.reasonCode")
    ? []
    : [errors.createTaskCodingSystemIssue("reasonCode", system)]
}
