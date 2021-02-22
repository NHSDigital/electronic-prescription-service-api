import {convertPatient} from "../patient"
import {convertBundleToPrescription} from "../prescription"
import {getIdentifierValueForSystem, toArray} from "../../common"
import {getMedicationRequests, getPatient} from "../../common/getResourcesOfType"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"

export function convertParentPrescription(
  fhirBundle: fhir.Bundle,
  convertPatientFn = convertPatient,
  convertBundleToPrescriptionFn = convertBundleToPrescription,
  convertCareRecordElementCategoriesFn = convertCareRecordElementCategories
): hl7V3.ParentPrescription {
  const messageId = getIdentifierValueForSystem(
    [fhirBundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )
  const hl7V3ParentPrescription = new hl7V3.ParentPrescription(
    new hl7V3.GlobalIdentifier(messageId)
  )

  const fhirPatient = getPatient(fhirBundle)
  const hl7V3Patient = convertPatientFn(fhirBundle, fhirPatient)
  hl7V3ParentPrescription.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  const hl7V3Prescription = convertBundleToPrescriptionFn(fhirBundle)
  hl7V3ParentPrescription.pertinentInformation1 = new hl7V3.ParentPrescriptionPertinentInformation1(
    hl7V3Prescription
  )

  const fhirMedicationRequests = getMedicationRequests(fhirBundle)
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]
  const validityPeriod = fhirFirstMedicationRequest.dispenseRequest.validityPeriod

  hl7V3ParentPrescription.effectiveTime = validityPeriod
    ? convertIsoDateTimeStringToHl7V3DateTime(
      validityPeriod.start,
      "MedicationRequest.dispenseRequest.validityPeriod.start"
    )
    : hl7V3Prescription.author.time

  const lineItems = toArray(hl7V3ParentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation2)
    .map(pertinentInformation2 => pertinentInformation2.pertinentLineItem)
  const careRecordElementCategory = convertCareRecordElementCategoriesFn(lineItems)
  hl7V3ParentPrescription.pertinentInformation2 = new hl7V3.ParentPrescriptionPertinentInformation2(
    careRecordElementCategory
  )

  return hl7V3ParentPrescription
}

export function extractEffectiveTime(medicationRequest: fhir.MedicationRequest): hl7V3.Timestamp {
  const validityPeriod = medicationRequest.dispenseRequest?.validityPeriod
  if (validityPeriod) {
    return convertIsoDateTimeStringToHl7V3DateTime(
      validityPeriod.start,
      "MedicationRequest.dispenseRequest.validityPeriod.start"
    )
  } else {
    return convertIsoDateTimeStringToHl7V3DateTime(
      medicationRequest.authoredOn,
      "MedicationRequest.authoredOn"
    )
  }
}

function convertCareRecordElementCategories(lineItems: Array<hl7V3.LineItem>) {
  const careRecordElementCategory = new hl7V3.CareRecordElementCategory()
  careRecordElementCategory.component = lineItems
    .map(act => new hl7V3.ActRef(act))
    .map(actRef => new hl7V3.CareRecordElementCategoryComponent(actRef))
  return careRecordElementCategory
}
