import Hapi from "@hapi/hapi"
import {fhir, validationErrors} from "@models"
import {
  QueryParam,
  queryParamMetadata,
  QueryParamProperties,
  ValidQuery
} from "../../routes/tracker/task"
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

  const querySupportedBySpine = validatedEntries.some(
    ([queryParam]) => queryParamMetadata.get(queryParam as QueryParam).querySupportedBySpine
  )
  if (!querySupportedBySpine) {
    const validQueryParameters = Array.from(queryParamMetadata.keys())
    return [validationErrors.createMissingQueryParameterIssue(validQueryParameters)]
  }

  const issues: Array<fhir.OperationOutcomeIssue> = []

  const hasArrayValuedParams = validatedEntries.some(([, value]) => Array.isArray(value))
  if (hasArrayValuedParams) {
    issues.push(validationErrors.invalidQueryParameterCombinationIssue)
  }

  const validatedQuery = Object.fromEntries(validatedEntries) as ValidQuery
  queryParamMetadata.forEach((metadata, queryParam) => {
    const queryParamValue = validatedQuery[queryParam]
    if (queryParamValue) {
      issues.push(...validateQueryParameter(metadata, queryParam, queryParamValue))
    }
  })

  return issues
}

function validateQueryParameter(metadata: QueryParamProperties, queryParam: QueryParam, queryParamValue: string) {
  const issues: Array<fhir.OperationOutcomeIssue> = []

  const validSystem = metadata.system
  const actualSystem = getSystem(queryParamValue)
  if (actualSystem && actualSystem !== validSystem) {
    issues.push(validationErrors.createInvalidSystemIssue(queryParam, validSystem))
  }

  return issues
}

export function getSystem(rawValue: string): string {
  const pipeIndex = rawValue?.indexOf("|") || -1
  if (pipeIndex !== -1) {
    return rawValue.substring(0, pipeIndex)
  }
  return undefined
}
