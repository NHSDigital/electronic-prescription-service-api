import Hapi from "@hapi/hapi"
import {fhir, validationErrors} from "@models"
import {getSystem, QueryParamDefinition, queryParamDefinitions} from "../../routes/tracker/task"
import {validatePermittedTrackerMessage} from "./scope-validator"
import {toArray} from "../translation/common"

const DATE_PARAM_MATCHER = /(eq|le|ge)\d{4}-\d{2}-\d{2}/

export const validateQueryParameters = (
  queryParams: Hapi.RequestQuery,
  scope: string
): Array<fhir.OperationOutcomeIssue> => {
  const permissionErrors = validatePermittedTrackerMessage(scope)
  if (permissionErrors.length) {
    return permissionErrors
  }

  const recognisedParameters: Array<[QueryParamDefinition, Array<string>]> = []
  for (const [queryParam, queryParamValue] of Object.entries(queryParams)) {
    const queryParamDefinition = queryParamDefinitions.find(definition => definition.name === queryParam)
    if (queryParamDefinition) {
      recognisedParameters.push([queryParamDefinition, toArray(queryParamValue)])
    }
  }

  const issues: Array<fhir.OperationOutcomeIssue> = []

  if (!recognisedParameters.some(([definition]) => definition.supportedBySpine)) {
    const requiredQueryParams = queryParamDefinitions
      .filter(definition => definition.supportedBySpine)
      .map(definition => definition.name)
    issues.push(validationErrors.createMissingQueryParameterIssue(requiredQueryParams))
  }

  recognisedParameters.forEach(([definition, values]) => {
    issues.push(...validateQueryParameter(definition, values))
  })

  return issues
}

function validateQueryParameter(
  definition: QueryParamDefinition,
  values: Array<string>
): Array<fhir.OperationOutcomeIssue> {
  const issues: Array<fhir.OperationOutcomeIssue> = []

  if (!definition.isDateParameter && values.length > 1) {
    issues.push(validationErrors.invalidQueryParameterCombinationIssue)
  }

  values.forEach(value => {
    issues.push(...validateQueryParameterValue(definition, value))
  })

  return issues
}

function validateQueryParameterValue(
  queryParamDefinition: QueryParamDefinition,
  value: string
): Array<fhir.OperationOutcomeIssue> {
  const issues: Array<fhir.OperationOutcomeIssue> = []

  const actualSystem = getSystem(value)
  const expectedSystem = queryParamDefinition.system
  if (actualSystem && actualSystem !== expectedSystem) {
    issues.push(validationErrors.createInvalidSystemIssue(queryParamDefinition.name, expectedSystem))
  }

  if (queryParamDefinition.isDateParameter) {
    if (!DATE_PARAM_MATCHER.test(value)) {
      issues.push({
        severity: "error",
        code: fhir.IssueCodes.INVALID,
        diagnostics: `Value for date param ${queryParamDefinition.name} should match pattern ${DATE_PARAM_MATCHER}.`
      })
    }
  }

  return issues
}
