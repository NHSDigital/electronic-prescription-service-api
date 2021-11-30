import {fhir, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"

export function verifyClaim(claim: fhir.Claim, scope: string): Array<fhir.OperationOutcomeIssue> {
  if (claim.resourceType !== "Claim") {
    return [errors.createResourceTypeIssue("Claim")]
  }

  const permissionErrors = validatePermittedAttendedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  return []
}
