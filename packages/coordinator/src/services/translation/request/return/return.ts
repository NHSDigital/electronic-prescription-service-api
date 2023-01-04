import {hl7V3, fhir, processingErrors as errors, spine} from "@models"
import {getCodeableConceptCodingForSystem, getMessageId} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {getMessageIdFromTaskFocusIdentifier, getPrescriptionShortFormIdFromTaskGroupIdentifier} from "../task"
import {
  getContainedPractitionerRoleViaReference,
  getContainedOrganizationViaReference
} from "../../common/getResourcesOfType"
import {createAuthor} from "../agent-person"
import {isReference} from "../../../../utils/type-guards"

export function convertTaskToDispenseProposalReturn(
  task: fhir.Task,
): hl7V3.DispenseProposalReturn {
  const idValue = getMessageId(task.identifier, "Task.identifier")
  const id = new hl7V3.GlobalIdentifier(idValue)
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  let taskPractitionerRole: fhir.PractitionerRole
  let taskOrganization: fhir.Organization

  if (isReference(task.requester)) {
    taskPractitionerRole = getContainedPractitionerRoleViaReference(
      task,
      task.requester.reference
    )

    if (isReference(taskPractitionerRole.organization)) {
      taskOrganization = getContainedOrganizationViaReference(
        task,
        taskPractitionerRole.organization.reference
      )
    }
  } else {
    throw new errors.InvalidValueError(
      "For return messages, task.requester must be a reference to a contained PractitionerRole resource."
    )
  }

  return new hl7V3.DispenseProposalReturn(
    id,
    effectiveTime,
    createAuthor(taskPractitionerRole, taskOrganization),
    createPertinentInformation1(task.groupIdentifier),
    createPertinentInformation3(task.statusReason),
    createReversalOf(task.focus.identifier))
}

export function createPertinentInformation1(
  groupIdentifier: fhir.Identifier
): hl7V3.DispenseProposalReturnPertinentInformation1 {
  const prescriptionIdValue = getPrescriptionShortFormIdFromTaskGroupIdentifier(groupIdentifier)
  const prescriptionId = new hl7V3.PrescriptionId(prescriptionIdValue)
  return new hl7V3.DispenseProposalReturnPertinentInformation1(prescriptionId)
}

export function createPertinentInformation3(
  reasonCode: fhir.CodeableConcept
): hl7V3.DispenseProposalReturnPertinentInformation3 {
  const reasonCoding = getCodeableConceptCodingForSystem(
    [reasonCode],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason",
    "Task.statusReason"
  )
  const returnReasonCode = new hl7V3.ReturnReasonCode(reasonCoding.code, reasonCoding.display)
  const returnReason = new hl7V3.ReturnReason(returnReasonCode)
  return new hl7V3.DispenseProposalReturnPertinentInformation3(returnReason)
}

export function createReversalOf(identifier: fhir.Identifier): hl7V3.DispenseProposalReturnReversalOf {
  const prescriptionReleaseResponseId = getMessageIdFromTaskFocusIdentifier(identifier)
  const prescriptionReleaseResponseRef = new hl7V3.PrescriptionReleaseResponseRef(prescriptionReleaseResponseId)
  return new hl7V3.DispenseProposalReturnReversalOf(prescriptionReleaseResponseRef)
}

