import {fhir, validationErrors as errors} from "@models"
import {validatePermittedDispenseMessage} from "./prescribing-dispensing-tracker"

export function verifyParameters(parameters: fhir.Parameters, scope: string): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  const permissionErrors = validatePermittedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  return []
}
