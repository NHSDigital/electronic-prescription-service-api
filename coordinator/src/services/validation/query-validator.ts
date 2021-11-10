import Hapi from "@hapi/hapi"
import {fhir, validationErrors} from "@models"
import {QueryParam, queryParamMetadata, ValidQuery} from "../../routes/tracker/task"
import {validatePermittedTrackerMessage} from "./scope-validator"

export const validateQueryParameters = (
  queryParams: Hapi.RequestQuery,
  scope: string
): Array<fhir.OperationOutcomeIssue> => {
  const permissionErrors = validatePermittedTrackerMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  const validatedEntries = Object.entries(queryParams).filter(
    ([queryParam]) => queryParamMetadata.has(queryParam as QueryParam)
  )
  if (validatedEntries.length === 0) {
    const validQueryParameters = Array.from(queryParamMetadata.keys())
    return [validationErrors.createMissingQueryParameterIssue(validQueryParameters)]
  }

  const issues: Array<fhir.OperationOutcomeIssue> = []

  const hasArrayValuedParams = validatedEntries.some(([, value]) => Array.isArray(value))
  if (hasArrayValuedParams) {
    issues.push(validationErrors.invalidQueryParameterCombinationIssue)
  }

  const validatedQuery = Object.fromEntries(validatedEntries) as ValidQuery
  if (validatedQuery[QueryParam.IDENTIFIER] && validatedQuery[QueryParam.FOCUS_IDENTIFIER]) {
    issues.push(validationErrors.invalidQueryParameterCombinationIssue)
  }

  queryParamMetadata.forEach((metadata, queryParam) => {
    const queryParamValue = validatedQuery[queryParam]
    const validSystem = metadata.system
    if (queryParamValue && !validateSystem(queryParamValue, validSystem)) {
      issues.push(validationErrors.createInvalidSystemIssue(queryParam, validSystem))
    }
  })

  return issues
}

function validateSystem(value: string, validSystem: string) {
  const pipeIndex = value.indexOf("|")
  if (pipeIndex === -1) {
    return true
  }

  const system = value.substring(0, pipeIndex)
  return system === validSystem
}
