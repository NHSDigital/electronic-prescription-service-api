import {fhir, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"

export function verifyClaim(
  claim: fhir.Claim, scope: string, accessTokenOds: string
): Array<fhir.OperationOutcomeIssue> {
  if (claim.resourceType !== "Claim") {
    return [errors.createResourceTypeIssue("Claim")]
  }

  const permissionErrors = validatePermittedAttendedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  if (claim.payee?.party) {
    const bodyOrg = claim.payee.party.identifier.value
    if (bodyOrg !== accessTokenOds) {
      console.warn(
        `Organization details do not match in request accessToken (${accessTokenOds}) and request body (${bodyOrg}).`
      )
    }
  }

  return []
}
