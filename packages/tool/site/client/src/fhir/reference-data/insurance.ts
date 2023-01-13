import * as fhir from "fhir/r4"

export const INSURANCE_NHS_BSA: fhir.ClaimInsurance = {
  sequence: 1,
  focal: true,
  coverage: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "T1450"
    },
    display: "NHS BUSINESS SERVICES AUTHORITY"
  }
}
