import {Resource} from "fhir/r4"
import {FhirPathBuilder, FhirPathReader} from "."

export interface Prescription {
    prescriptionId: string
    prescriptionShortFormId: string
    nhsNumber: string
    repeatsIssued: string
}

// TODO: Share function with EPSAT client when creating PrescriptionSummaryView
export async function buildPrescription(fhirPrescription: Resource): Promise<Prescription> {
  const fhirPathBuilder = new FhirPathBuilder()
  const fhirPathReader = new FhirPathReader(fhirPrescription)

  const bundle = fhirPathBuilder.bundle()

  const medicationRequest = bundle.medicationRequest()
  const prescriptionId = await fhirPathReader.read(medicationRequest.prescriptionId())
  const prescriptionShortFormId = await fhirPathReader.read(medicationRequest.prescriptionShortFormId())
  const repeatsIssued = await fhirPathReader.read(medicationRequest.repeatsIssued())

  const patient = bundle.patient()
  const nhsNumber = await fhirPathReader.read(patient.nhsNumber())

  return {
    prescriptionId,
    prescriptionShortFormId,
    nhsNumber,
    repeatsIssued
  }
}
