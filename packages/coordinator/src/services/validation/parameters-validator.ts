import {fhir, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage, validatePermittedUnattendedDispenseMessage} from "./scope-validator"
import {getIdentifierValueForSystem, getOwnerParameterOrNull} from "../translation/common"
import {isPractitionerRole, isReference} from "../../utils/type-guards"

const REQUIRED_PARAMETER_NAMES = ["status", "group-identifier"] as const

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
    true
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

  // Things that are always required, regardless of permissions
  const validationErrors: Array<fhir.OperationOutcomeIssue> = []
  validationErrors.push(...validateRequiredParameters(parameters))

  // Application-restricted specific validation
  if (isApplicationRestricted) {
    validationErrors.push(...validateApplicationRestrictedAgent(parameters))
    return validationErrors
  }

  // User-restricted specific validation
  validationErrors.push(...validateUserRestrictedAgent(parameters, accessTokenSDSUserID, accessTokenSDSRoleID))
  return validationErrors
}

function validateRequiredParameters(parameters: fhir.Parameters): Array<fhir.OperationOutcomeIssue> {
  // All requests must have an "owner" resource, and include a "status" and "group-identifier" parameter
  const validationErrors: Array<fhir.OperationOutcomeIssue> = []

  if (!getOwnerParameterOrNull(parameters)) {
    validationErrors.push(errors.missingRequiredParameter("owner"))
  }

  for (const parameterName of REQUIRED_PARAMETER_NAMES) {
    if (!hasParameterWithName(parameters, parameterName)) {
      validationErrors.push(errors.missingRequiredParameter(parameterName))
    }
  }

  return validationErrors
}

function validateApplicationRestrictedAgent(parameters: fhir.Parameters): Array<fhir.OperationOutcomeIssue> {
  // Application-restricted messages must not include an agent parameter, since the agent is the application itself
  if (hasParameterWithName(parameters, "agent")) {
    return [errors.unexpectedField('Parameters.parameter("agent")')]
  }

  return []
}

function validateUserRestrictedAgent(
  parameters: fhir.Parameters,
  accessTokenSDSUserID: string,
  accessTokenSDSRoleID: string
): Array<fhir.OperationOutcomeIssue> {
  // User-restricted messages must include a valid agent parameter with practitioner role information about the user,
  // and that information must be consistent with the access token
  const validationErrors: Array<fhir.OperationOutcomeIssue> = []
  const agentParameter = getAgentPractitionerRoleParameter(parameters)

  if (!agentParameter) {
    return [errors.missingRequiredParameter("agent")]
  }

  const practitionerRole = agentParameter.resource
  validationErrors.push(...validateAgentPractitionerRole(practitionerRole))

  if (validationErrors.length) {
    return validationErrors
  }

  const {practitioner} = practitionerRole
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

  if (practitionerRole.identifier) {
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

  return validationErrors
}

function validateAgentPractitionerRole(
  practitionerRole: fhir.PractitionerRole
): Array<fhir.OperationOutcomeIssue> {
  // Practitioner role resources have a specific structure. Check that
  const validationErrors: Array<fhir.OperationOutcomeIssue> = []
  const {practitioner, telecom} = practitionerRole

  if (practitioner && isReference(practitioner)) {
    validationErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.practitioner')
    )
  }

  if (!telecom?.length) {
    validationErrors.push(
      errors.missingRequiredField('Parameters.parameter("agent").resource.telecom')
    )
  }

  return validationErrors
}

function hasParameterWithName(parameters: fhir.Parameters, parameterName: string): boolean {
  return parameters.parameter.some(parameter => parameter.name === parameterName)
}

function getAgentPractitionerRoleParameter(
  parameters: fhir.Parameters
): fhir.ResourceParameter<fhir.PractitionerRole> | null {
  // Search for the agent parameter within a Parameters resource.
  const agentParameter = parameters.parameter.find(
    (parameter): parameter is fhir.ResourceParameter<fhir.PractitionerRole> => (
      parameter.name === "agent" &&
      "resource" in parameter &&
      isPractitionerRole(parameter.resource)
    )
  )

  return agentParameter ?? null
}
