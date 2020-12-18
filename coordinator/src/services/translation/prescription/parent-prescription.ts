import * as fhir from "../../../models/fhir/fhir-resources"
import {convertPatient} from "./patient"
import {convertBundleToPrescription} from "."
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../common"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {getMedicationRequests, getPatient} from "../common/getResourcesOfType"

export function convertParentPrescription(
  fhirBundle: fhir.Bundle,
  convertPatientFn = convertPatient,
  convertBundleToPrescriptionFn = convertBundleToPrescription,
  convertCareRecordElementCategoriesFn = convertCareRecordElementCategories
): prescriptions.ParentPrescription {
  const hl7V3ParentPrescription = new prescriptions.ParentPrescription(
    new codes.GlobalIdentifier(fhirBundle.id),
    new core.Timestamp("PLACEHOLDER")
  )

  const fhirPatient = getPatient(fhirBundle)
  const hl7V3Patient = convertPatientFn(fhirBundle, fhirPatient)
  hl7V3ParentPrescription.recordTarget = new prescriptions.RecordTarget(hl7V3Patient)

  const hl7V3Prescription = convertBundleToPrescriptionFn(fhirBundle)
  hl7V3ParentPrescription.pertinentInformation1 = new prescriptions.ParentPrescriptionPertinentInformation1(
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

  const lineItems = hl7V3ParentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation2
    .map(info => info.pertinentLineItem)
  const careRecordElementCategory = convertCareRecordElementCategoriesFn(lineItems)
  hl7V3ParentPrescription.pertinentInformation2 = new prescriptions.ParentPrescriptionPertinentInformation2(
    careRecordElementCategory
  )

  return hl7V3ParentPrescription
}

export function extractEffectiveTime(medicationRequest: fhir.MedicationRequest): core.Timestamp {
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

function convertCareRecordElementCategories(lineItems: Array<prescriptions.LineItem>) {
  const careRecordElementCategory = new prescriptions.CareRecordElementCategory()
  careRecordElementCategory.component = lineItems
    .map(act => new prescriptions.ActRef(act))
    .map(actRef => new prescriptions.CareRecordElementCategoryComponent(actRef))
  return careRecordElementCategory
}
