import * as fhir from "../../../../models/fhir"
import * as hl7V3 from "../../../../models/hl7-v3"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {createAuthorForUnattendedAccess} from "../agent-unattended"
import * as pino from "pino"

export async function convertTaskToDispenseProposalReturn(
  task: fhir.Task,
  logger: pino.Logger
): Promise<hl7V3.DispenseProposalReturn> {
  const idValue = getIdentifierValueForSystem(
    task.identifier,
    "https://tools.ietf.org/html/rfc4122",
    "Task.identifier"
  )
  const id = new hl7V3.GlobalIdentifier(idValue)
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const dispenseProposalReturn = new hl7V3.DispenseProposalReturn(id, effectiveTime)

  //TODO - move Author classes out of messaging file. Rename Author to PrescriptionAuthor.
  const odsOrganizationCode = task.owner.identifier.value
  dispenseProposalReturn.author = await createAuthorForUnattendedAccess(odsOrganizationCode, logger)

  const prescriptionIdValue = getIdentifierValueForSystem(
    [task.groupIdentifier],
    "https://fhir.nhs.uk/Id/prescription-order-number",
    "Task.groupIdentifier"
  )
  const prescriptionId = new hl7V3.PrescriptionId(prescriptionIdValue)
  dispenseProposalReturn.pertinentInformation1 = new hl7V3.DispenseProposalReturnPertinentInformation1(prescriptionId)

  const reasonCoding = getCodeableConceptCodingForSystem(
    [task.reasonCode],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason",
    "Task.reasonCode"
  )
  const returnReasonCode = new hl7V3.ReturnReasonCode(reasonCoding.code, reasonCoding.display)
  const returnReason = new hl7V3.ReturnReason(returnReasonCode)
  dispenseProposalReturn.pertinentInformation3 = new hl7V3.DispenseProposalReturnPertinentInformation3(returnReason)

  const prescriptionReleaseResponseId = task.focus.identifier.value
  const prescriptionReleaseResponseRef = new hl7V3.PrescriptionReleaseResponseRef(prescriptionReleaseResponseId)
  dispenseProposalReturn.reversalOf = new hl7V3.DispenseProposalReturnReversalOf(prescriptionReleaseResponseRef)

  return dispenseProposalReturn
}
