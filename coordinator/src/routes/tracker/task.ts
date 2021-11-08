import Hapi from "@hapi/hapi"
import {fhir, validationErrors} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"
import {trackerClient} from "../../services/communication/tracker"
import {convertSpineResponseToFhir} from "../../services/communication/tracker/translation"
import {RequestHeaders} from "../../utils/headers"
import * as LosslessJson from "lossless-json"
import {isBundle, isTask} from "../../utils/type-guards"

export enum QueryParam {
  IDENTIFIER = "identifier",
  FOCUS_IDENTIFIER = "focus:identifier",
  PATIENT_IDENTIFIER = "patient:identifier"
}

type ValidQuery = Partial<Record<QueryParam, string>>

const queryParamToValidSystem = new Map<QueryParam, string>([
  [QueryParam.FOCUS_IDENTIFIER, "https://fhir.nhs.uk/Id/prescription-order-number"],
  [QueryParam.IDENTIFIER, "https://fhir.nhs.uk/Id/prescription-order-number"],
  [QueryParam.PATIENT_IDENTIFIER, "https://fhir.nhs.uk/Id/nhs-number"]
])

async function makeSpineRequest(validQuery: ValidQuery, request: Hapi.Request) {
  const prescriptionIdentifier = getValue(validQuery, QueryParam.FOCUS_IDENTIFIER)
    || getValue(validQuery, QueryParam.IDENTIFIER)
  if (prescriptionIdentifier) {
    return await trackerClient.getPrescription(prescriptionIdentifier, request.headers, request.logger)
  }

  const patientIdentifier = getValue(validQuery, QueryParam.PATIENT_IDENTIFIER)
  if (patientIdentifier) {
    return await trackerClient.getPrescriptions(patientIdentifier, request.headers, request.logger)
  }
}

export default [{
  method: "GET",
  path: `${BASE_PATH}/Task`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const query = request.query
    const issues = validateQueryParameters(query)
    if (issues.length) {
      const response = fhir.createOperationOutcome(issues)
      const statusCode = getStatusCode(issues)
      return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
    }

    const validQuery = query as ValidQuery
    const spineResponse = await makeSpineRequest(validQuery, request)

    if (request.headers[RequestHeaders.RAW_RESPONSE]) {
      return responseToolkit
        .response(JSON.stringify(spineResponse))
        .code(200)
        .type(ContentTypes.JSON)
    }

    const result = convertSpineResponseToFhir(spineResponse)
    if (isBundle(result)) {
      filterBundleEntries(result, validQuery)
    }
    return responseToolkit
      .response(LosslessJson.stringify(result))
      .code(200)
      .type(ContentTypes.FHIR)
  }
}]

//TODO - move validation code to the validation section of the repo

export const validateQueryParameters = (queryParams: Hapi.RequestQuery): Array<fhir.OperationOutcomeIssue> => {
  const validQueryParams = Object.values(QueryParam).map(value => value.toString())
  const validatedEntries = Object.entries(queryParams).filter(([queryParam]) => validQueryParams.includes(queryParam))
  if (validatedEntries.length === 0) {
    return [validationErrors.createMissingQueryParameterIssue(validQueryParams)]
  }

  const hasArrayValuedParams = validatedEntries.some(([, value]) => Array.isArray(value))
  if (hasArrayValuedParams) {
    return [validationErrors.invalidQueryParameterCombinationIssue]
  }

  const validatedQuery = Object.fromEntries(validatedEntries) as ValidQuery
  if (validatedQuery[QueryParam.IDENTIFIER] && validatedQuery[QueryParam.FOCUS_IDENTIFIER]) {
    return [validationErrors.invalidQueryParameterCombinationIssue]
  }

  const invalidSystemIssues: Array<fhir.OperationOutcomeIssue> = []
  queryParamToValidSystem.forEach((validSystem, queryParam) => {
    if (!validateSystem(validatedQuery[queryParam], validSystem)) {
      invalidSystemIssues.push(validationErrors.createInvalidSystemIssue(queryParam, validSystem))
    }
  })
  if (invalidSystemIssues) {
    return invalidSystemIssues
  }

  return []
}

function validateSystem(value: string, validSystem: string) {
  if (!value) {
    return true
  }
  const pipeIndex = value.indexOf("|")
  if (pipeIndex === -1) {
    return true
  }

  const system = value.substring(0, pipeIndex)
  return system === validSystem
}

function getValue(query: ValidQuery, param: QueryParam): string {
  const rawValue = query[param]
  if (!rawValue) {
    return rawValue
  }

  const systemPrefix = queryParamToValidSystem.get(param) + "|"
  if (rawValue.startsWith(systemPrefix)) {
    return rawValue.substring(systemPrefix.length)
  }

  return rawValue
}

function filterBundleEntries(result: fhir.Bundle, queryParams: ValidQuery) {
  result.entry = result.entry.filter(entry => isTask(entry.resource) && filterTask(entry.resource, queryParams))
}

function filterTask(task: fhir.Task, queryParams: ValidQuery) {
  const focusIdentifier = getValue(queryParams, QueryParam.FOCUS_IDENTIFIER)
  if (focusIdentifier && task.focus.identifier.value !== focusIdentifier) {
    return false
  }

  const identifier = getValue(queryParams, QueryParam.IDENTIFIER)
  if (identifier && task.focus.identifier.value !== focusIdentifier) {
    return false
  }

  const patientIdentifier = getValue(queryParams, QueryParam.PATIENT_IDENTIFIER)
  if (patientIdentifier && task.for.identifier.value !== patientIdentifier) {
    return false
  }

  return true
}
