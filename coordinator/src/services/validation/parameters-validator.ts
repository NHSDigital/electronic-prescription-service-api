import {fhir, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage, validatePermittedUnattendedDispenseMessage} from "./scope-validator"
import {
  getIdentifierParameterByName,
  getIdentifierParameterOrNullByName,
  getResourceParameterByName
} from "../translation/common"
import {isReference} from "../../utils/type-guards"

export function verifyParameters(
  parameters: fhir.Parameters, scope: string, accessTokenOds: string
): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [errors.createResourceTypeIssue("Parameters")]
  }

  const prescriptionIdParameter = getIdentifierParameterOrNullByName(parameters.parameter, "group-identifier")
  const permissionErrors = prescriptionIdParameter
    ? validatePermittedAttendedDispenseMessage(scope)
    : validatePermittedUnattendedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  const incorrectValueErrors = []

  const organizationParameter = getIdentifierParameterByName(parameters.parameter, "owner")
  if (organizationParameter) {
    const bodyOrg = organizationParameter.valueIdentifier.value
    if (bodyOrg !== accessTokenOds) {
      console.warn(
        `Organization details do not match in request accessToken (${accessTokenOds}) and request body (${bodyOrg}).`
      )
    }
  }

  const agentParameter = getResourceParameterByName<fhir.PractitionerRole>(parameters.parameter, "agent")
  const practitionerRole = agentParameter.resource
  const {practitioner, organization, telecom} = practitionerRole
  if (isReference(practitioner)) {
    incorrectValueErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.practitioner')
    )
  }
  if (isReference(organization)) {
    incorrectValueErrors.push(
      errors.fieldIsReferenceButShouldNotBe('Parameters.parameter("agent").resource.organization')
    )
  }
  if (!telecom?.length) {
    incorrectValueErrors.push(
      errors.missingRequiredField('Parameters.parameter("agent").resource.telecom')
    )
  }

  return incorrectValueErrors
}
