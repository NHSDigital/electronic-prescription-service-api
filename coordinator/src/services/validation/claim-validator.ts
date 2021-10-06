import {fhir, validationErrors as errors} from "@models"
import {validatePermittedDispenseMessage} from "./prescribing-dispensing-tracker"

export function verifyClaim(claim: fhir.Claim, scope: string): Array<fhir.OperationOutcomeIssue> {
  if (claim.resourceType !== "Claim") {
    return [errors.createResourceTypeIssue("Claim")]
  }

  const permissionErrors = validatePermittedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  return []
}
