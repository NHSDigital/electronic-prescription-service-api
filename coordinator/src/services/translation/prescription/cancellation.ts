import * as fhir from "../../../models/fhir/fhir-resources"
import {convertPatient} from "./patient"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import * as cancellations from "../../../models/hl7-v3/hl7-v3-cancellation"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {getPatient, getMedicationRequests} from "../common/getResourcesOfType"
import {convertAuthor, convertResponsibleParty} from "./practitioner"
import * as common from "../common"
import {getExtensionForUrl, getIdentifierValueForSystem} from "../common"
import {extractEffectiveTime} from "./parent-prescription"

export function convertCancellation(
  fhirBundle: fhir.Bundle,
  convertPatientFn = convertPatient,
): cancellations.CancellationPrescription {
  const fhirFirstMedicationRequest = getMedicationRequests(fhirBundle)[0]
  const effectiveTime = extractEffectiveTime(fhirFirstMedicationRequest)

  const hl7V3CancellationPrescription = new cancellations.CancellationPrescription(
    new codes.GlobalIdentifier(fhirBundle.id), effectiveTime
  )

  const fhirPatient = getPatient(fhirBundle)
  const hl7V3Patient = convertPatientFn(fhirBundle, fhirPatient)
  hl7V3CancellationPrescription.recordTarget = new prescriptions.RecordTarget(hl7V3Patient)

  const hl7V3CancelRequester = convertResponsibleParty(fhirBundle, fhirFirstMedicationRequest)
  hl7V3CancellationPrescription.author = new prescriptions.Author()
  hl7V3CancellationPrescription.author.AgentPerson = hl7V3CancelRequester.AgentPerson

  const hl7V3OriginalPrescriptionAuthor = convertAuthor(fhirBundle, fhirFirstMedicationRequest)
  hl7V3CancellationPrescription.responsibleParty = new prescriptions.ResponsibleParty()
  hl7V3CancellationPrescription.responsibleParty.AgentPerson = hl7V3OriginalPrescriptionAuthor.AgentPerson

  hl7V3CancellationPrescription.pertinentInformation2 = new cancellations.PertinentInformation2(
    fhirFirstMedicationRequest.groupIdentifier.value
  )

  const lineItemToCancel = getIdentifierValueForSystem(
    fhirFirstMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  hl7V3CancellationPrescription.pertinentInformation1 = new cancellations.PertinentInformation1(lineItemToCancel)

  const statusReason = common.getCodingForSystem(
    fhirFirstMedicationRequest.statusReason.coding,
    "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
    "MedicationRequest.statusReason")
  hl7V3CancellationPrescription.pertinentInformation = new cancellations.PertinentInformation(
    statusReason.code,
    statusReason.display
  )

  const prescriptionToCancel = getExtensionForUrl(
    fhirFirstMedicationRequest.groupIdentifier.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  hl7V3CancellationPrescription.pertinentInformation3 = new cancellations.PertinentInformation3(
    prescriptionToCancel.valueIdentifier.value
  )

  return hl7V3CancellationPrescription
}
