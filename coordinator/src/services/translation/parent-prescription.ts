import * as fhir from "../../model/fhir-resources"
import {convertPatient} from "./patient"
import {convertBundleToPrescription} from "./prescription"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {convertIsoStringToDateTime} from "./common"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import {getMedicationRequests, getPatient} from "./common/getResourcesOfType"

export function convertParentPrescription(
  fhirBundle: fhir.Bundle,
  convertPatientFn = convertPatient,
  convertBundleToPrescriptionFn = convertBundleToPrescription,
  convertCareRecordElementCategoriesFn = convertCareRecordElementCategories
): prescriptions.ParentPrescription {
  const fhirMedicationRequests = getMedicationRequests(fhirBundle)
  const fhirFirstMedicationRequest = fhirMedicationRequests[0]

  const hl7V3ParentPrescription = new prescriptions.ParentPrescription(
    new codes.GlobalIdentifier(fhirBundle.id),
    convertIsoStringToDateTime(fhirFirstMedicationRequest.authoredOn)
  )

  const fhirPatient = getPatient(fhirBundle)
  const hl7V3Patient = convertPatientFn(fhirBundle, fhirPatient)
  hl7V3ParentPrescription.recordTarget = new prescriptions.RecordTarget(hl7V3Patient)

  const hl7V3Prescription = convertBundleToPrescriptionFn(fhirBundle)
  hl7V3ParentPrescription.pertinentInformation1 = new prescriptions.ParentPrescriptionPertinentInformation1(hl7V3Prescription)

  const lineItems = hl7V3ParentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation2.map(info => info.pertinentLineItem)
  const careRecordElementCategory = convertCareRecordElementCategoriesFn(lineItems)
  hl7V3ParentPrescription.pertinentInformation2 = new prescriptions.ParentPrescriptionPertinentInformation2(careRecordElementCategory)

  return hl7V3ParentPrescription
}

function convertCareRecordElementCategories(lineItems: Array<prescriptions.LineItem>) {
  const careRecordElementCategory = new prescriptions.CareRecordElementCategory()
  careRecordElementCategory.component = lineItems
    .map(act => new prescriptions.ActRef(act))
    .map(actRef => new prescriptions.CareRecordElementCategoryComponent(actRef))
  return careRecordElementCategory
}
