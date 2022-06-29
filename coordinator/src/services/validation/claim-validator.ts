import {fhir, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"
import {getContainedOrganizationViaReference} from "../translation/common/getResourcesOfType"
import {getIdentifierValueForSystem} from "../translation/common"

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

  const containedOrganization = getContainedOrganizationViaReference(claim, claim.payee.party.reference)
  const bodyOrg = getIdentifierValueForSystem(
    containedOrganization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    "Claim.contained(Organization).identifier"
  )
  if (bodyOrg !== accessTokenOds) {
    console.warn(
      `Organization details do not match in request accessToken (${accessTokenOds}) and request body (${bodyOrg}).`
    )
  }

  return []
}
