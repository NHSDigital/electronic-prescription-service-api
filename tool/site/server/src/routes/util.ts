import {Bundle, OperationOutcome} from "fhir/r4";

export function isBundleOfBundles(fhirResponse: Bundle | OperationOutcome): fhirResponse is Bundle {
  return !!(fhirResponse as Bundle)?.entry?.length
}