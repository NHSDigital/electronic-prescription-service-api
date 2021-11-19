import {fhir, validationErrors as errors} from "@models"
import {validatePermittedDispenseMessage} from "./scope-validator"
import {getIdentifierParameterByName} from "../translation/common"

export function verifyParameters(
  parameters: fhir.Parameters, scope: string, accessTokenOds: string
): Array<fhir.OperationOutcomeIssue> {
  const validationErrors = []
  if (parameters.resourceType !== "Parameters") {
    validationErrors.push(errors.createResourceTypeIssue("Parameters"))
  }

  const permissionErrors = validatePermittedDispenseMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  const organizationParameter = getIdentifierParameterByName(parameters.parameter, "owner")
  if (organizationParameter) {
    const bodyOrg = organizationParameter.valueIdentifier.value
    if (bodyOrg !== accessTokenOds) {
      console.warn(errors.createInconsistentOrganizationIssue(
        "parameters.parameter(owner)",
        accessTokenOds,
        bodyOrg
      ))
    }
  }

  return validationErrors
}
