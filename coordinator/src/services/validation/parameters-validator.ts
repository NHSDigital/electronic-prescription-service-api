import {fhir, processingErrors, validationErrors as errors} from "@models"
import {validatePermittedAttendedDispenseMessage, validatePermittedUnattendedDispenseMessage} from "./scope-validator"
import {
  getIdentifierParameterOrNullByName,
  getAgentParameter,
  isResourceParameter
} from "../translation/common"
import {isReference} from "../../utils/type-guards"

export function verifyParameters(
  parameters: fhir.Parameters, scope: string
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

  const resourceParameters = parameters.parameter.filter(isResourceParameter)
  const ownerParameter = resourceParameters.find(parameter => parameter.name === "owner")
  if(!ownerParameter){
    throw new processingErrors.InvalidValueError(
      `Parameter with name owner not found`
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

  return incorrectValueErrors
}
