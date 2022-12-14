import {fhir} from "@models"

const prescriptionTypeExtensionUrl = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType"

const doctorPrescriptionType: fhir.Coding = {
  system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
  code: "1001",
  display: "Outpatient Community Prescriber - Medical Prescriber"
}

const nursePrescriptionType: fhir.Coding = {
  system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
  code: "1004",
  display: "Outpatient Community Prescriber - Nurse Independent/Supplementary prescriber"
}

const pharmacistPrescriptionType: fhir.Coding = {
  system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
  code: "1008",
  display: "Outpatient Community Prescriber - Pharmacist Independent/Supplementary prescriber"
}

const prescriptionTypeExtensions = new Map<string, fhir.CodingExtension>()
prescriptionTypeExtensions.set("doctor", {
  url: prescriptionTypeExtensionUrl,
  valueCoding: doctorPrescriptionType
})
prescriptionTypeExtensions.set("nurse", {
  url: prescriptionTypeExtensionUrl,
  valueCoding: nursePrescriptionType
})
prescriptionTypeExtensions.set("pharmacist", {
  url: prescriptionTypeExtensionUrl,
  valueCoding: pharmacistPrescriptionType
})

export default prescriptionTypeExtensions
