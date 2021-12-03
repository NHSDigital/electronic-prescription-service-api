import {hl7V3, fhir} from "@models"
import {getCodeableConceptCodingForSystem, getMessageId} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import * as pino from "pino"
import {
  createAuthorFromProvenanceAgentExtension,
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../task"

export async function convertTaskToDispenseProposalReturn(
  task: fhir.Task,
  logger: pino.Logger
): Promise<hl7V3.DispenseProposalReturn> {
  const idValue = getMessageId(task.identifier, "Task.identifier")
  const id = new hl7V3.GlobalIdentifier(idValue)
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const dispenseProposalReturn = new hl7V3.DispenseProposalReturn(id, effectiveTime)

  dispenseProposalReturn.author = await createAuthorFromProvenanceAgentExtension(task, logger)
  dispenseProposalReturn.pertinentInformation1 = createPertinentInformation1(task.groupIdentifier)
  dispenseProposalReturn.pertinentInformation3 = createPertinentInformation3(task.reasonCode)
  dispenseProposalReturn.reversalOf = createReversalOf(task.focus.identifier)

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
    "Task.reasonCode"
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

// function createAuthorFromProvenanceAgentExtension(
//   task: fhir.Task
// ): hl7V3.Author {
//   const authorExtension = getExtensionForUrl(
//     task.extension,
//     "https://fhir.nhs.uk/StructureDefinition/Extension-Provenance-agent",
//     "Task.extension"
//   ) as fhir.IdentifierReferenceExtension<fhir.Practitioner | fhir.PractitionerRole>
//   const sdsId = authorExtension.valueReference.identifier.value
//   const author = new hl7V3.Author()
//   const agentPerson = new hl7V3.AgentPerson()
//   author.id = new hl7V3.UnattendedSdsRoleProfileIdentifier()
//   agentPersonSds.agentPersonSDS = new hl7V3.AgentPersonPersonSds(new hl7V3.SdsUniqueIdentifier(sdsId))
//   return new hl7V3.Author(agentPersonSds)
// }
