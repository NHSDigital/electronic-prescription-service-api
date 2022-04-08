import {hl7V3, fhir} from "@models"
import {getCodeableConceptCodingForSystem, getMessageId} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import * as pino from "pino"
import {getMessageIdFromTaskFocusIdentifier, getPrescriptionShortFormIdFromTaskGroupIdentifier} from "../task"
import Hapi from "@hapi/hapi"
import {getContainedPractitionerRole} from "../../common/getResourcesOfType"
import {createAgentPersonFromAuthenticatedUserDetailsAndPractitionerRole} from "../agent-unattended"

export async function convertTaskToDispenseProposalReturn(
  task: fhir.Task,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.DispenseProposalReturn> {
  const idValue = getMessageId(task.identifier, "Task.identifier")
  const id = new hl7V3.GlobalIdentifier(idValue)
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const dispenseProposalReturn = new hl7V3.DispenseProposalReturn(id, effectiveTime)

  const taskPractitionerRole = getContainedPractitionerRole(
    task,
    task.requester.reference
  )

  dispenseProposalReturn.author = await createAuthor(taskPractitionerRole, headers, logger)
  dispenseProposalReturn.pertinentInformation1 = createPertinentInformation1(task.groupIdentifier)
  dispenseProposalReturn.pertinentInformation3 = createPertinentInformation3(task.statusReason)
  dispenseProposalReturn.reversalOf = createReversalOf(task.focus.identifier)

  return dispenseProposalReturn
}

export async function createAuthor(
  practitionerRole: fhir.PractitionerRole,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.Author> {
  const agentPerson = await createAgentPersonFromAuthenticatedUserDetailsAndPractitionerRole(
    practitionerRole,
    headers,
    logger
  )
  const author = new hl7V3.Author()
  author.AgentPerson = agentPerson
  return author
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

