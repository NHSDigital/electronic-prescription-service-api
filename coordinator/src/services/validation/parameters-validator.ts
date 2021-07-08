import {fhir, validationErrors as errors} from "@models"
import {featureBlockedDispenseMessage} from "../../utils/feature-flags"

export function verifyParameters(parameters: fhir.Parameters): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  if (featureBlockedDispenseMessage()) {
    return [errors.featureBlockedIssue]
  }

  return []
}
