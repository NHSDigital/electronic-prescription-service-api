import {fhir, validationErrors as errors} from "@models"

export function verifyParameters(parameters: fhir.Parameters): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  if (process.env.DISPENSE_ENABLED !== "true") {
    return [errors.functionalityDisabled]
  }

  return []
}
