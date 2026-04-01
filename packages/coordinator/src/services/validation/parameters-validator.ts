import {fhir, validationErrors as errors} from "@models"
import {
  isApplicationRestrictedScope,
  validatePermittedAttendedDispenseMessage,
  validatePermittedUnattendedDispenseMessage
} from "./scope-validator"
import {getAgentParameter, getOwnerParameterOrNull, getIdentifierValueForSystem} from "../translation/common"
import {isReference} from "../../utils/type-guards"

export function verifyAttendedParameters(
  parameters: fhir.Parameters,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
  return verifyParameters(
    parameters,
    validatePermittedAttendedDispenseMessage(scope),
    accessTokenSDSUserID,
    accessTokenSDSRoleID,
    false
  )
}

export function verifyUnattendedParameters(
  parameters: fhir.Parameters,
  scope: string,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
  return verifyParameters(
    parameters,
    validatePermittedUnattendedDispenseMessage(scope),
    accessTokenSDSUserID,
    accessTokenSDSRoleID,
    isApplicationRestrictedScope(scope)
  )
}

function verifyParameters(
  parameters: fhir.Parameters,
  permissionErrors: Array<fhir.OperationOutcomeIssue>,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string,
  isApplicationRestricted: boolean
): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  if (permissionErrors.length) {
    return permissionErrors
  }

  const incorrectValueErrors = []

  const ownerParameter = getOwnerParameterOrNull(parameters)
  if (!ownerParameter) {
    incorrectValueErrors.push(
      errors.missingRequiredParameter("owner")
    )
  }

  const agentParameter = getAgentParameter(parameters)
  const practitionerRole = agentParameter.resource
  const {practitioner, telecom} = practitionerRole
  if (practitioner && isReference(practitioner)) {
    incorrectValueErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.practitioner')
    )
  }
  if (!telecom?.length) {
    incorrectValueErrors.push(
      errors.missingRequiredField('Parameters.parameter("agent").resource.telecom')
    )
  }

  if (practitioner && !isReference(practitioner)) {
    const bodySDSUserID = getIdentifierValueForSystem(
      [practitioner.identifier],
      "https://fhir.nhs.uk/Id/sds-user-id",
      'parameters.parameter("PractitionerRole").practitioner.identifier'
    )
    if (bodySDSUserID !== accessTokenSDSUserID) {
      console.warn(
        // eslint-disable-next-line max-len
        `SDS Unique User ID does not match between access token and message body. Access Token: ${accessTokenSDSUserID} Body: ${bodySDSUserID}.`
      )
    }
  }

  // Only enforce practitioner roles if we are user-restricted
  if (practitionerRole.identifier && !isApplicationRestricted) {
    const bodySDSRoleID = getIdentifierValueForSystem(
      practitionerRole.identifier,
      "https://fhir.nhs.uk/Id/sds-role-profile-id",
      'parameters.parameter("PractitionerRole").identifier'
    )
    if (bodySDSRoleID !== accessTokenSDSRoleID) {
      console.warn(
        // eslint-disable-next-line max-len
        `SDS Role ID does not match between access token and message body. Access Token: ${accessTokenSDSRoleID} Body: ${bodySDSRoleID}.`
      )
    }
  }

  return incorrectValueErrors
}
