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

const queryParamMetadata = new Map([
  [QueryParam.FOCUS_IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    getTaskField: (task: fhir.Task) => task.focus.identifier
  }],
  [QueryParam.IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    getTaskField: task => task.focus.identifier
  }],
  [QueryParam.PATIENT_IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/nhs-number",
    getTaskField: task => task.for.identifier
  }]
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

function getValue(query: ValidQuery, param: QueryParam): string {
  const rawValue = query[param]
  if (!rawValue) {
    return rawValue
  }

  const systemPrefix = queryParamMetadata.get(param) + "|"
  if (rawValue.startsWith(systemPrefix)) {
    return rawValue.substring(systemPrefix.length)
  }

  return rawValue
}

function filterBundleEntries(result: fhir.Bundle, queryParams: ValidQuery) {
  result.entry = result.entry.filter(entry => isTask(entry.resource) && filterTask(entry.resource, queryParams))
}

function filterTask(task: fhir.Task, queryParams: ValidQuery) {
  queryParamMetadata.forEach((metadata, queryParam) => {
    const queryParamValue = getValue(queryParams, queryParam)
    if (queryParamValue && metadata.getTaskField(task) !== queryParamValue) {
      return false
    }
  })
  return true
}
