import {convertPatient} from "../patient"
import {convertBundleToPrescription} from "../prescription"
import {getMessageId, toArray} from "../../common"
import {getMedicationRequests, getPatient} from "../../common/getResourcesOfType"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../../common/dateTime"
import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"

export function convertParentPrescription(
  bundle: fhir.Bundle,
  convertPatientFn = convertPatient,
  convertBundleToPrescriptionFn = convertBundleToPrescription,
  convertCareRecordElementCategoriesFn = convertCareRecordElementCategories
): hl7V3.ParentPrescription {
  const messageId = getMessageId([bundle.identifier])

  const parentPrescription = new hl7V3.ParentPrescription(
    new hl7V3.GlobalIdentifier(messageId)
  )

  const fhirPatient = getPatient(bundle)
  const hl7V3Patient = convertPatientFn(bundle, fhirPatient)
  parentPrescription.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  const prescription = convertBundleToPrescriptionFn(bundle)
  parentPrescription.pertinentInformation1 = new hl7V3.ParentPrescriptionPertinentInformation1(prescription)

  const medicationRequests = getMedicationRequests(bundle)
  const firstMedicationRequest = medicationRequests[0]
  const validityPeriod = firstMedicationRequest.dispenseRequest.validityPeriod

  parentPrescription.effectiveTime = validityPeriod
    ? convertIsoDateTimeStringToHl7V3DateTime(
      validityPeriod.start,
      "MedicationRequest.dispenseRequest.validityPeriod.start"
    )
    : prescription.author.time

  const lineItems = toArray(parentPrescription.pertinentInformation1.pertinentPrescription.pertinentInformation2)
    .map(pertinentInformation2 => pertinentInformation2.pertinentLineItem)
  const careRecordElementCategory = convertCareRecordElementCategoriesFn(lineItems)
  parentPrescription.pertinentInformation2 = new hl7V3.ParentPrescriptionPertinentInformation2(
    careRecordElementCategory
  )

  return parentPrescription
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
