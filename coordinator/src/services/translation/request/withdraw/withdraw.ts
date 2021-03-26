import * as hl7V3 from "../../../../models/hl7-v3"
import {fhir} from "@models"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem, getMessageId} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {
  getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../task"

export function convertTaskToEtpWithdraw(task: fhir.Task): hl7V3.EtpWithdraw {
  const id = getMessageId(task.identifier, "Task.identifier")
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const etpWithdraw = new hl7V3.EtpWithdraw(new hl7V3.GlobalIdentifier(id), effectiveTime)

  etpWithdraw.recordTarget = createRecordTarget(task.for.identifier)
  etpWithdraw.author = createAuthor()
  etpWithdraw.pertinentInformation3 = createPertinentInformation3(task.groupIdentifier)
  etpWithdraw.pertinentInformation2 = createPertinentInformation2()
  etpWithdraw.pertinentInformation5 = createPertinentInformation5(task.reasonCode)
  etpWithdraw.pertinentInformation4 = createPertinentInformation4(task.focus.identifier)

  return etpWithdraw
}

export function createRecordTarget(identifier: fhir.Identifier): hl7V3.RecordTargetReference {
  const nhsNumber = getIdentifierValueForSystem(
    [identifier],
    "https://fhir.nhs.uk/Id/nhs-number",
    "Task.for.identifier"
  )
  const patient = new hl7V3.Patient()
  patient.id = new hl7V3.NhsNumber(nhsNumber)
  return new hl7V3.RecordTargetReference(patient)
}

export function createAuthor(): hl7V3.AuthorPersonSds {
  const agentPersonSds = new hl7V3.AgentPersonSds()
  agentPersonSds.id = new hl7V3.UnattendedSdsRoleProfileIdentifier()
  agentPersonSds.agentPersonSDS = new hl7V3.AgentPersonPersonSds(new hl7V3.UnattendedSdsUniqueIdentifier())
  return new hl7V3.AuthorPersonSds(agentPersonSds)
}

export function createPertinentInformation3(groupIdentifier: fhir.Identifier): hl7V3.EtpWithdrawPertinentInformation3 {
  const prescriptionIdValue = getPrescriptionShortFormIdFromTaskGroupIdentifier(groupIdentifier)
  const withdrawId = new hl7V3.WithdrawId(prescriptionIdValue)
  return new hl7V3.EtpWithdrawPertinentInformation3(withdrawId)
}

export function createPertinentInformation2(): hl7V3.EtpWithdrawPertinentInformation2 {
  const withdrawType = new hl7V3.WithdrawType("LD", "Last Dispense")
  return new hl7V3.EtpWithdrawPertinentInformation2(withdrawType)
}

export function createPertinentInformation5(reasonCode: fhir.CodeableConcept): hl7V3.EtpWithdrawPertinentInformation5 {
  const reasonCoding = getCodeableConceptCodingForSystem(
    [reasonCode],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason",
    "Task.reasonCode"
  )
  const withdrawReason = new hl7V3.WithdrawReason(reasonCoding.code, reasonCoding.display)
  return new hl7V3.EtpWithdrawPertinentInformation5(withdrawReason)
}

export function createPertinentInformation4(identifier: fhir.Identifier): hl7V3.EtpWithdrawPertinentInformation4 {
  const dispenseNotificationRefValue = getMessageIdFromTaskFocusIdentifier(identifier)
  const dispenseNotificationRef = new hl7V3.DispenseNotificationRef(dispenseNotificationRefValue)
  return new hl7V3.EtpWithdrawPertinentInformation4(dispenseNotificationRef)
}
