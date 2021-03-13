import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import * as pino from "pino"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {
  createAuthorFromTaskOwnerIdentifier,
  createIdFromTaskIdentifier, getMessageIdFromTaskFocusIdentifier,
  getPrescriptionShortFormIdFromTaskGroupIdentifier
} from "../task"

export async function convertTaskToEtpWithdraw(
  task: fhir.Task,
  logger: pino.Logger
): Promise<hl7V3.EtpWithdraw> {
  const id = createIdFromTaskIdentifier(task.identifier)
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const etpWithdraw = new hl7V3.EtpWithdraw(id, effectiveTime)

  etpWithdraw.recordTarget = createRecordTarget(task.for.identifier)
  //TODO - find out whether we need to handle user instead of organization (and what we do about org details if so)
  etpWithdraw.author = await createAuthorFromTaskOwnerIdentifier(task.owner.identifier, logger)
  etpWithdraw.pertinentInformation3 = createPertinentInformation3(task.groupIdentifier)
  etpWithdraw.pertinentInformation2 = createPertinentInformation2(task.code)
  etpWithdraw.pertinentInformation5 = createPertinentInformation5(task.reasonCode)
  etpWithdraw.pertinentInformation4 = createPertinentInformation4(task.focus.identifier)

  return etpWithdraw
}

function createRecordTarget(identifier: fhir.Identifier) {
  const nhsNumber = getIdentifierValueForSystem(
    [identifier],
    "https://fhir.nhs.uk/Id/nhs-number",
    "Task.for.identifier"
  )
  const patient = new hl7V3.Patient()
  patient.id = new hl7V3.NhsNumber(nhsNumber)
  return new hl7V3.DispenseRecordTarget(patient)
}

function createPertinentInformation3(groupIdentifier: fhir.Identifier) {
  const prescriptionIdValue = getPrescriptionShortFormIdFromTaskGroupIdentifier(groupIdentifier)
  const withdrawId = new hl7V3.WithdrawId(prescriptionIdValue)
  return new hl7V3.EtpWithdrawPertinentInformation3(withdrawId)
}

function createPertinentInformation2(code: fhir.CodeableConcept) {
  const typeCoding = getCodeableConceptCodingForSystem(
    [code],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-type",
    "Task.code"
  )
  const withdrawType = new hl7V3.WithdrawType(typeCoding.code, typeCoding.display)
  return new hl7V3.EtpWithdrawPertinentInformation2(withdrawType)
}

function createPertinentInformation5(reasonCode: fhir.CodeableConcept) {
  const reasonCoding = getCodeableConceptCodingForSystem(
    [reasonCode],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason",
    "Task.reasonCode"
  )
  const withdrawReason = new hl7V3.WithdrawReason(reasonCoding.code, reasonCoding.display)
  return new hl7V3.EtpWithdrawPertinentInformation5(withdrawReason)
}

function createPertinentInformation4(identifier: fhir.Identifier) {
  const dispenseNotificationRefValue = getMessageIdFromTaskFocusIdentifier(identifier)
  const dispenseNotificationRef = new hl7V3.DispenseNotificationRef(dispenseNotificationRefValue)
  return new hl7V3.EtpWithdrawPertinentInformation4(dispenseNotificationRef)
}
