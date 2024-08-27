import {fhir, hl7V3, processingErrors} from "@models"
import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getMessageId
} from "../../common"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import {getMessageIdFromTaskFocusIdentifier, getPrescriptionShortFormIdFromTaskGroupIdentifier} from "../task"
import {
  getContainedOrganizationViaReference,
  getContainedPractitionerRoleViaReference
} from "../../common/getResourcesOfType"
import {isReference} from "../../../../utils/type-guards"
import {createAuthorForWithdraw} from "../agent-person"
import {RepeatInstanceInfo} from "../../../../../../models/hl7-v3/withdraw"

export function convertTaskToEtpWithdraw(task: fhir.Task): hl7V3.EtpWithdraw {
  const id = getMessageId(task.identifier, "Task.identifier")
  const effectiveTime = convertIsoDateTimeStringToHl7V3DateTime(task.authoredOn, "Task.authoredOn")
  const etpWithdraw = new hl7V3.EtpWithdraw(new hl7V3.GlobalIdentifier(id), effectiveTime)

  const practitionerRoleRef = task.requester
  if (!isReference(practitionerRoleRef)) {
    throw new processingErrors.InvalidValueError(
      "task.requester should be a reference to contained.practitionerRole",
      "task.requester"
    )
  }
  const practitionerRole = getContainedPractitionerRoleViaReference(task, practitionerRoleRef.reference)

  const organizationRef = practitionerRole.organization
  if (!isReference(organizationRef)) {
    throw new processingErrors.InvalidValueError(
      "practitionerRole.organization should be a Reference",
      'task.contained("PractitionerRole").organization'
    )
  }
  const organization = getContainedOrganizationViaReference(task, organizationRef.reference)

  const repeatInformation = getExtensionForUrlOrNull(
    task.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    'Task.extension("EPS-Repeat-Information")'
  ) as fhir.ExtensionExtension<fhir.IntegerExtension>

  etpWithdraw.recordTarget = createRecordTarget(task.for.identifier)
  etpWithdraw.author = createAuthorForWithdraw(practitionerRole, organization)

  etpWithdraw.pertinentInformation3 = createPertinentInformation3(task.groupIdentifier)

  if (repeatInformation) {
    const numberOfRepeatsIssuedExtension = getExtensionForUrl(
      repeatInformation.extension,
      "numberOfRepeatsIssued",
      `Task.extension("https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation").extension`
    ) as fhir.IntegerExtension

    const repeatNumber = numberOfRepeatsIssuedExtension.valueInteger.toString()
    etpWithdraw.pertinentInformation1 = createPertinentInformation1(repeatNumber)
  }

  etpWithdraw.pertinentInformation2 = createPertinentInformation2()
  etpWithdraw.pertinentInformation5 = createPertinentInformation5(task.statusReason)
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

export function createPertinentInformation1(
  repeatNumber: string
): hl7V3.EtpWithdrawPertinentInformation1 {
  const newRepeatNumber = Number(repeatNumber) + 1
  const repeatInstanceInfo = new RepeatInstanceInfo("RPI", newRepeatNumber.toString())
  return new hl7V3.EtpWithdrawPertinentInformation1(repeatInstanceInfo)
}

export function createPertinentInformation2(): hl7V3.EtpWithdrawPertinentInformation2 {
  const withdrawType = new hl7V3.WithdrawType("LD", "Last Dispense")
  return new hl7V3.EtpWithdrawPertinentInformation2(withdrawType)
}

export function createPertinentInformation3(groupIdentifier: fhir.Identifier): hl7V3.EtpWithdrawPertinentInformation3 {
  const prescriptionIdValue = getPrescriptionShortFormIdFromTaskGroupIdentifier(groupIdentifier)
  const withdrawId = new hl7V3.WithdrawId(prescriptionIdValue)
  return new hl7V3.EtpWithdrawPertinentInformation3(withdrawId)
}

export function createPertinentInformation4(identifier: fhir.Identifier): hl7V3.EtpWithdrawPertinentInformation4 {
  const dispenseNotificationRefValue = getMessageIdFromTaskFocusIdentifier(identifier)
  const dispenseNotificationRef = new hl7V3.DispenseNotificationRef(dispenseNotificationRefValue)
  return new hl7V3.EtpWithdrawPertinentInformation4(dispenseNotificationRef)
}

export function createPertinentInformation5(reasonCode: fhir.CodeableConcept): hl7V3.EtpWithdrawPertinentInformation5 {
  const reasonCoding = getCodeableConceptCodingForSystem(
    [reasonCode],
    "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason",
    "Task.statusReason"
  )
  const withdrawReason = new hl7V3.WithdrawReason(reasonCoding.code, reasonCoding.display)
  return new hl7V3.EtpWithdrawPertinentInformation5(withdrawReason)
}
