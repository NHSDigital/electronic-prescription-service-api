import * as fhir from "../../../models/fhir/fhir-resources"

export function createPatient(): fhir.Patient {
  return {resourceType: "Patient"}
}
