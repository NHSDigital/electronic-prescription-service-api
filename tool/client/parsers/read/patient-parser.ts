import {BundleEntry, Patient} from "../../models"

export function getNhsNumber(fhirPatient: BundleEntry): string {
  return (fhirPatient.resource as Patient).identifier.filter(
    i => i.system === "https://fhir.nhs.uk/Id/nhs-number"
  )[0].value
}
