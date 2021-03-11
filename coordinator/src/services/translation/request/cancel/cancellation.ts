import {convertPatient} from "../patient"
import {getMedicationRequests, getPatient} from "../../common/getResourcesOfType"
import {convertAuthor, convertResponsibleParty} from "../practitioner"
import * as common from "../../common"
import {getExtensionForUrl, getIdentifierValueForSystem, getMessageId} from "../../common"
import {extractEffectiveTime} from "../prescribe/parent-prescription"
import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"

export function convertCancellation(bundle: fhir.Bundle, convertPatientFn = convertPatient): hl7V3.CancellationRequest {
  const fhirFirstMedicationRequest = getMedicationRequests(bundle)[0]
  const effectiveTime = extractEffectiveTime(fhirFirstMedicationRequest)

  const messageId = getMessageId(bundle)

  const cancellationRequest = new hl7V3.CancellationRequest(
    new hl7V3.GlobalIdentifier(messageId), effectiveTime
  )

  const fhirPatient = getPatient(bundle)
  const hl7V3Patient = convertPatientFn(bundle, fhirPatient)
  cancellationRequest.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  const hl7V3CancelRequester = convertResponsibleParty(bundle, fhirFirstMedicationRequest)
  cancellationRequest.author = new hl7V3.Author()
  cancellationRequest.author.AgentPerson = hl7V3CancelRequester.AgentPerson

  const hl7V3OriginalPrescriptionAuthor = convertAuthor(bundle, fhirFirstMedicationRequest)
  cancellationRequest.responsibleParty = new hl7V3.ResponsibleParty()
  cancellationRequest.responsibleParty.AgentPerson = hl7V3OriginalPrescriptionAuthor.AgentPerson

  cancellationRequest.pertinentInformation2 = new hl7V3.CancellationRequestPertinentInformation2(
    fhirFirstMedicationRequest.groupIdentifier.value
  )

  const lineItemToCancel = getIdentifierValueForSystem(
    fhirFirstMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  cancellationRequest.pertinentInformation1 = new hl7V3.CancellationRequestPertinentInformation1(lineItemToCancel)

  const statusReason = common.getCodingForSystem(
    fhirFirstMedicationRequest.statusReason.coding,
    "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
    "MedicationRequest.statusReason")
  cancellationRequest.pertinentInformation = new hl7V3.CancellationRequestPertinentInformation(
    statusReason.code,
    statusReason.display
  )

  const prescriptionToCancel = getExtensionForUrl(
    fhirFirstMedicationRequest.groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  cancellationRequest.pertinentInformation3 = new hl7V3.CancellationRequestPertinentInformation3(
    prescriptionToCancel.valueIdentifier.value
  )

  return cancellationRequest
}
