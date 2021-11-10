import Hapi from "@hapi/hapi"
import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"
import {trackerClient} from "../../services/communication/tracker"
import {convertSpineTrackerResponseToFhir} from "../../services/translation/response/tracker/translation"
import {getScope, RequestHeaders} from "../../utils/headers"
import * as LosslessJson from "lossless-json"
import {isBundle, isTask} from "../../utils/type-guards"
import {validateQueryParameters} from "../../services/validation/query-validator"

export enum QueryParam {
  IDENTIFIER = "identifier",
  FOCUS_IDENTIFIER = "focus:identifier",
  PATIENT_IDENTIFIER = "patient:identifier"
}

export type ValidQuery = Partial<Record<QueryParam, string>>

interface QueryParamProperties {
  system: string
  getTaskField: (task: fhir.Task) => string
}

export const queryParamMetadata = new Map<QueryParam, QueryParamProperties>([
  [QueryParam.FOCUS_IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    getTaskField: task => task.focus.identifier.value
  }],
  [QueryParam.IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    getTaskField: task => task.focus.identifier.value
  }],
  [QueryParam.PATIENT_IDENTIFIER, {
    system: "https://fhir.nhs.uk/Id/nhs-number",
    getTaskField: task => task.for.identifier.value
  }]
])

export default [{
  method: "GET",
  path: `${BASE_PATH}/Task`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const query = request.query
    const scope = getScope(request.headers)
    const issues = validateQueryParameters(query, scope)
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

    const result = convertSpineTrackerResponseToFhir(spineResponse)
    if (isBundle(result)) {
      filterBundleEntries(result, validQuery)
    }
    return responseToolkit
      .response(LosslessJson.stringify(result))
      .code(200)
      .type(ContentTypes.FHIR)
  }
}]

async function makeSpineRequest(validQuery: ValidQuery, request: Hapi.Request) {
  const prescriptionIdentifier = getValue(validQuery, QueryParam.FOCUS_IDENTIFIER)
    || getValue(validQuery, QueryParam.IDENTIFIER)
  if (prescriptionIdentifier) {
    return await trackerClient.getPrescriptionById(prescriptionIdentifier, request.headers, request.logger)
  }

  const patientIdentifier = getValue(validQuery, QueryParam.PATIENT_IDENTIFIER)
  if (patientIdentifier) {
    return await trackerClient.getPrescriptionsByPatientId(patientIdentifier, request.headers, request.logger)
  }
}

export function getValue(query: ValidQuery, param: QueryParam): string {
  const rawValue = query[param]
  const pipeIndex = rawValue?.indexOf("|") || -1
  if (pipeIndex !== -1) {
    return rawValue.substring(pipeIndex + 1)
  }
  return rawValue
}

export function filterBundleEntries(bundle: fhir.Bundle, queryParams: ValidQuery): void {
  const filteredEntries = bundle.entry.filter(entry =>
    isTask(entry.resource)
    && matchesQuery(entry.resource, queryParams)
  )
  bundle.entry = filteredEntries
  bundle.total = filteredEntries.length
}

export function matchesQuery(task: fhir.Task, queryParams: ValidQuery): boolean {
  for (const [queryParam, metadata] of queryParamMetadata) {
    const queryParamValue = getValue(queryParams, queryParam)
    if (queryParamValue && metadata.getTaskField(task) !== queryParamValue) {
      return false
    }
  }
  return true
}
