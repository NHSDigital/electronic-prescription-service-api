import {fhir, validationErrors as errors} from "@models"
import {isReference} from "../../utils/type-guards"
import {getIdentifierValueForSystem} from "../translation/common"
import {getContainedPractitionerRoleViaReference} from "../translation/common/getResourcesOfType"
import {medicationDispenseEndorsementPresent} from "../translation/request/dispense/dispense-claim"
import {validatePermittedAttendedDispenseMessage} from "./scope-validator"
import pino from "pino"

export function verifyClaim(
  claim: fhir.Claim,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string,
  logger: pino.Logger<never>
): Array<fhir.OperationOutcomeIssue> {
  if (claim.resourceType !== "Claim") {
    return [errors.createResourceTypeIssue("Claim")]
  }

  const incorrectValueErrors: Array<fhir.OperationOutcomeIssue> = []

  validateReimbursementAuthority(claim, incorrectValueErrors)

  const practitionerRole = getContainedPractitionerRoleViaReference(
    claim,
    claim.provider.reference
  )

  if (practitionerRole.practitioner && isReference(practitionerRole.practitioner)) {
    incorrectValueErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.practitioner')
    )
  }

  if (practitionerRole.practitioner && !isReference(practitionerRole.practitioner)) {
    const bodySDSUserID = getIdentifierValueForSystem(
      [practitionerRole.practitioner.identifier],
      "https://fhir.nhs.uk/Id/sds-user-id",
      'claim.contained("PractitionerRole").practitioner.identifier'
    )
    if (bodySDSUserID !== accessTokenSDSUserID) {
      logger.warn({
        accessTokenSDSUserID,
        bodySDSUserID
      },
      "SDS Unique User ID does not match between access token and message body"
      )
    }
  }

  if (practitionerRole.identifier) {
    const bodySDSRoleID = getIdentifierValueForSystem(
      practitionerRole.identifier,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      'claim.contained("PractitionerRole").identifier'
    )
    if (bodySDSRoleID !== accessTokenSDSRoleID) {
      logger.warn({
        accessTokenSDSRoleID,
        bodySDSRoleID
      },
      "SDS Role ID does not match between access token and message body"
      )
    }
  }

  const permissionErrors = validatePermittedAttendedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  if (!medicationDispenseEndorsementPresent(claim)) {
    incorrectValueErrors.push(
      errors.createMissingEndorsementCode()
    )
  }

  return incorrectValueErrors
}

function validateReimbursementAuthority(claim: fhir.Claim, incorrectValueErrors: Array<fhir.OperationOutcomeIssue>) {
  const insurance = claim.insurance
  if (insurance.length !== 1) {
    incorrectValueErrors.push(
      errors.invalidArrayLengthIssue("Claim.insurance", insurance.length, 1)
    )
    return
  }

  const authority = insurance[0].coverage.identifier.value

  const approvedAuthorities = ["T1450", "RQFZ1"]
  if (!approvedAuthorities.includes(authority)) {
    incorrectValueErrors.push(
      errors.createClaimInvalidValueIssue("insurance[0].coverage.identifier.value", ...approvedAuthorities)
    )
  }
}
