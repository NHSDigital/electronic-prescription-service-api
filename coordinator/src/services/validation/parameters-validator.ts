import {fhir, validationErrors as errors} from "@models"
import {validatePermittedDispenseMessage} from "./features"

export function verifyParameters(parameters: fhir.Parameters, scope: string): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  const featureErrors = validatePermittedDispenseMessage(scope)
  if (featureErrors.length) {
    return featureErrors
  }

  return []
}
