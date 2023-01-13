import * as fhir from "fhir/r4"

export const CODEABLE_CONCEPT_CLAIM_TYPE_PHARMACY: fhir.CodeableConcept = {
  coding: [
    {
      system: "http://terminology.hl7.org/CodeSystem/claim-type",
      code: "pharmacy",
      display: "Pharmacy"
    }
  ]
}

export const CODEABLE_CONCEPT_PRIORITY_NORMAL: fhir.CodeableConcept = {
  coding: [
    {
      system: "http://terminology.hl7.org/CodeSystem/processpriority",
      code: "normal"
    }
  ]
}

export const CODEABLE_CONCEPT_PAYEE_TYPE_PROVIDER: fhir.CodeableConcept = {
  coding: [
    {
      system: "http://terminology.hl7.org/CodeSystem/payeetype",
      code: "provider",
      display: "Provider"
    }
  ]
}

export const CODEABLE_CONCEPT_PRESCRIPTION: fhir.CodeableConcept = {
  coding: [
    {
      system: "http://snomed.info/sct",
      code: "16076005",
      display: "Prescription"
    }
  ]
}

export const CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_PAID: fhir.CodeableConcept = {
  coding: [
    {
      system: "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge",
      code: "paid-once",
      display: "Paid Once"
    }
  ]
}

export const CODEABLE_CONCEPT_PRESCRIPTION_CHARGE_NOT_PAID: fhir.CodeableConcept = {
  coding: [
    {
      system: "https://fhir.nhs.uk/CodeSystem/DM-prescription-charge",
      code: "not-paid",
      display: "Not Paid"
    }
  ]
}

export const CODEABLE_CONCEPT_EXEMPTION_EVIDENCE_SEEN: fhir.CodeableConcept = {
  coding: [
    {
      system: "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence",
      code: "evidence-seen",
      display: "Evidence Seen"
    }
  ]
}

export const CODEABLE_CONCEPT_EXEMPTION_NO_EVIDENCE_SEEN: fhir.CodeableConcept = {
  coding: [
    {
      system: "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence",
      code: "no-evidence-seen",
      display: "No Evidence Seen"
    }
  ]
}
