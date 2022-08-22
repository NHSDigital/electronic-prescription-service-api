import {Resource} from "fhir/r4"
import {FhirPathBuilder, FhirPathReader} from "."

export interface Prescription {
    prescriptionId: string
    prescriptionShortFormId: string
    nhsNumber: string
    repeatsIssued: string
}

// TODO: Share function with EPSAT client when creating PrescriptionSummaryView
export function buildPrescription(fhirPrescription: Resource): Prescription {
  const fhirPathBuilder = new FhirPathBuilder()
  const fhirPathReader = new FhirPathReader(fhirPrescription)

  const bundle = fhirPathBuilder.bundle()

  const medicationRequest = bundle.medicationRequest()
  const prescriptionId = fhirPathReader.read(medicationRequest.prescriptionId())
  const prescriptionShortFormId = fhirPathReader.read(medicationRequest.prescriptionShortFormId())
  const repeatsIssued = fhirPathReader.read(medicationRequest.repeatsIssued())

  const patient = bundle.patient()
  const nhsNumber = fhirPathReader.read(patient.nhsNumber())

  return {
    prescriptionId,
    prescriptionShortFormId,
    nhsNumber,
    repeatsIssued
  }
}
