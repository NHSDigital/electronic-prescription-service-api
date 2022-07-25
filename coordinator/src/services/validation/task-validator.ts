import {fhir, validationErrors as errors, processingErrors} from "@models"
import {isReference} from "../../utils/type-guards"
import {
  getCodeableConceptCodingForSystem,
  getCodingForSystemOrNull,
  getIdentifierValueForSystem
} from "../translation/common"
import {getContainedPractitionerRoleViaReference} from "../translation/common/getResourcesOfType"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"

export function verifyTask(
  task: fhir.Task,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
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

  const statusSpecificErrors = performStatusSpecificValidation(task, accessTokenSDSUserID, accessTokenSDSRoleID)
  validationErrors.push(...statusSpecificErrors)

  return validationErrors
}

function performStatusSpecificValidation(
  task: fhir.Task,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
  switch (task.status) {
    case fhir.TaskStatus.IN_PROGRESS:
      return validateWithdraw(task, accessTokenSDSUserID, accessTokenSDSRoleID)
    case fhir.TaskStatus.REJECTED:
      return validateReturn(task, accessTokenSDSUserID, accessTokenSDSRoleID)
    default:
      return [errors.createTaskIncorrectValueIssue("status", fhir.TaskStatus.IN_PROGRESS, fhir.TaskStatus.REJECTED)]
  }
}

function validateWithdraw(task: fhir.Task, accessTokenSDSUserID: string, accessTokenSDSRoleID: string) {
  const withdrawSpecificErrors: Array<fhir.OperationOutcomeIssue> = []

  const practitionerRoleRef = task.requester
  if (!isReference(practitionerRoleRef)) {
    throw new processingErrors.InvalidValueError(
      "task.requester should be a reference to contained.practitionerRole",
      "task.requester"
    )
  }
  const practitionerRole = getContainedPractitionerRoleViaReference(
    task,
    practitionerRoleRef.reference
  )
  if (practitionerRole.practitioner && isReference(practitionerRole.practitioner)) {
    withdrawSpecificErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Task.contained("PractitionerRole").practitioner')
    )
  }

  if (practitionerRole.practitioner && !isReference(practitionerRole.practitioner)) {
    const bodySDSUserID = getIdentifierValueForSystem(
      [practitionerRole.practitioner.identifier],
      "https://fhir.nhs.uk/Id/sds-user-id",
      'task.contained("PractitionerRole").practitioner.identifier'
    )
    if (bodySDSUserID !== accessTokenSDSUserID) {
      console.warn(
        `SDS Unique User ID does not match between access token and message body.
        Access Token: ${accessTokenSDSRoleID} Body: ${bodySDSUserID}.`
      )
    }
  }

  if (practitionerRole.identifier) {
    const bodySDSRoleID = getIdentifierValueForSystem(
      practitionerRole.identifier,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      'task.contained("PractitionerRole").identifier'
    )
    if (bodySDSRoleID !== accessTokenSDSRoleID) {
      console.warn(
        `SDS Role ID does not match between access token and message body.
        Access Token: ${accessTokenSDSRoleID} Body: ${bodySDSRoleID}.`
      )
    }
  }

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

function validateReturn(task: fhir.Task, accessTokenSDSUserID: string, accessTokenSDSRoleID: string) {
  const returnSpecificErrors = []

  const practitionerRoleRef = task.requester
  if (!isReference(practitionerRoleRef)) {
    throw new processingErrors.InvalidValueError(
      "task.requester should be a reference to contained.practitionerRole",
      "task.requester"
    )
  }
  const practitionerRole = getContainedPractitionerRoleViaReference(
    task,
    practitionerRoleRef.reference
  )
  if (practitionerRole.practitioner && isReference(practitionerRole.practitioner)) {
    returnSpecificErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.practitioner')
    )
  }

  if (practitionerRole.practitioner && !isReference(practitionerRole.practitioner)) {
    const bodySDSUserID = getIdentifierValueForSystem(
      [practitionerRole.practitioner.identifier],
      "https://fhir.nhs.uk/Id/sds-user-id",
      'task.contained("PractitionerRole").practitioner.identifier'
    )
    if (bodySDSUserID !== accessTokenSDSUserID) {
      console.warn(
        `SDS Unique User ID does not match between access token and message body.
        Access Token: ${accessTokenSDSUserID} Body: ${bodySDSUserID}.`
      )
    }
  }

  if (practitionerRole.identifier) {
    const bodySDSRoleID = getIdentifierValueForSystem(
      practitionerRole.identifier,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      'task.contained("PractitionerRole").identifier'
    )
    if (bodySDSRoleID !== accessTokenSDSRoleID) {
      console.warn(
        `SDS Role ID does not match between access token and message body.
        Access Token: ${accessTokenSDSRoleID} Body: ${bodySDSRoleID}.`
      )
    }
  }

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
