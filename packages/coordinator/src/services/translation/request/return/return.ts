import {hl7V3, fhir, processingErrors as errors} from "@models"
import {getCodeableConceptCodingForSystem, getMessageId} from "../../common"
import {getMessageIdFromTaskFocusIdentifier, getPrescriptionShortFormIdFromTaskGroupIdentifier} from "../task"
import {
  getContainedPractitionerRoleViaReference,
  getContainedOrganizationViaReference
} from "../../common/getResourcesOfType"
import {createAuthor} from "../agent-person"
import {isReference} from "../../../../utils/type-guards"
import {
  DispenseProposalReturnPertinentInformation2,
  DispenseProposalReturnRepeat,
  RepeatInstanceInfo
} from "../../../../../../models/hl7-v3/return"
import {
  EpsRepeatInformationExtension,
  IntegerExtension,
  PrescriptionExtension
} from "../../../../../../models/fhir/extension"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"

export function convertTaskToDispenseProposalReturn(
  task: fhir.Task
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
  const repeatInfoExtensions = getRepeatInfoExtension(task.extension)

  if (repeatInfoExtensions) {
    const repeatNumber = getRepeatNumberIssued(repeatInfoExtensions as Array<IntegerExtension>)
    const repeatInstanceInfo = new RepeatInstanceInfo(repeatNumber, "RPI")
    const dispenseProposalReturnPertinentInformation2 = new DispenseProposalReturnPertinentInformation2(
      repeatInstanceInfo
    )

    return new DispenseProposalReturnRepeat(
      id,
      effectiveTime,
      createAuthor(taskPractitionerRole, taskOrganization),
      createPertinentInformation1(task.groupIdentifier),
      createPertinentInformation3(task.statusReason),
      createReversalOf(task.focus.identifier),
      dispenseProposalReturnPertinentInformation2
    )

  }

  const dispenseProposalReturn = new hl7V3.DispenseProposalReturn(
    id,
    effectiveTime,
    createAuthor(taskPractitionerRole, taskOrganization),
    createPertinentInformation1(task.groupIdentifier),
    createPertinentInformation3(task.statusReason),
    createReversalOf(task.focus.identifier))

  return dispenseProposalReturn
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

function getRepeatInfoExtension(extensions: Array<PrescriptionExtension | EpsRepeatInformationExtension>) {
  const repeatExtension = extensions?.find(
    e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation")
  return repeatExtension?.extension
}

function getRepeatNumberIssued(repeatInfoExtensions: Array<IntegerExtension>): number {
  const numberOfRepeatsIssued = repeatInfoExtensions.find(
    x => x.url === "numberOfRepeatsIssued"
  ).valueInteger.valueOf() as number
  const incrementedNumberOfRepeatsIssued = numberOfRepeatsIssued + 1

  return incrementedNumberOfRepeatsIssued
}
