import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getStatusCode} from "../../utils/status-code"
import {trackerClient} from "../../services/communication/tracker111"
import {convertSpineTrackerResponseToFhir} from "../../services/translation/response/tracker/translation"
import {getScope, RequestHeaders} from "../../utils/headers"
import * as LosslessJson from "lossless-json"
import {isBundle, isTask} from "../../utils/type-guards"
import {validateQueryParameters} from "../../services/validation/query-validator"
import {getCodeableConceptCodingForSystem, toArray} from "../../services/translation/common"
import moment from "moment"
import pino from "pino"

export interface ValidQuery {
  "identifier"?: string
  "focus:identifier"?: string
  "patient:identifier"?: string
  "business-status"?: string
  "authored-on"?: string | Array<string>
}

export interface QueryParamDefinition {
  name: keyof ValidQuery,
  validInIsolation: boolean
  system: string
  dateParameter: boolean
  test: (task: fhir.Task, value: string) => boolean
}

export const queryParamDefinitions: Array<QueryParamDefinition> = [
  {
    name: "focus:identifier",
    validInIsolation: true,
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    dateParameter: false,
    test: (task: fhir.Task, value: string): boolean => task.focus.identifier.value === value
  },
  {
    name: "identifier",
    validInIsolation: true,
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    dateParameter: false,
    test: (task: fhir.Task, value: string): boolean => task.focus.identifier.value === value
  },
  {
    name: "patient:identifier",
    validInIsolation: true,
    system: "https://fhir.nhs.uk/Id/nhs-number",
    dateParameter: false,
    test: (task: fhir.Task, value: string): boolean => task.for.identifier.value === value
  },
  {
    name: "business-status",
    validInIsolation: false,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    dateParameter: false,
    test: (task: fhir.Task, value: string): boolean => getCodeableConceptCodingForSystem(
      [task.businessStatus],
      "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      "Task.businessStatus"
    ).code === value
  },
  {
    name: "authored-on",
    validInIsolation: false,
    system: undefined,
    dateParameter: true,
    test: (task: fhir.Task, value: string): boolean => testDate(task.authoredOn, value)
  }
]

/* The NHS111 Tracker */

export default [{
  method: "GET" as RouteDefMethods,
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
      filterBundleEntries(result, validQuery, request.logger)
    }
    return responseToolkit
      .response(LosslessJson.stringify(result))
      .code(200)
      .type(ContentTypes.FHIR)
  }
}]

async function makeSpineRequest(validQuery: ValidQuery, request: Hapi.Request) {
  const prescriptionIdentifier = getValue(validQuery["focus:identifier"]) || getValue(validQuery["identifier"])
  if (prescriptionIdentifier) {
    return await trackerClient.getPrescriptionById(prescriptionIdentifier, request.headers, request.logger)
  }

  const patientIdentifier = getValue(validQuery["patient:identifier"])
  if (patientIdentifier) {
    const businessStatus = getValue(validQuery["business-status"])
    const authoredOn = toArray(validQuery["authored-on"] || []).map(getValue)
    const earliestDate = toSpineDateFormat(getEarliestDate(authoredOn))
    const latestDate = toSpineDateFormat(getLatestDate(authoredOn))
    return await trackerClient.getPrescriptionsByPatientId(
      patientIdentifier,
      businessStatus,
      earliestDate,
      latestDate,
      request.headers,
      request.logger
    )
  }

  throw new Error("Attempting to make tracker request without prescription or patient identifier")
}

export function filterBundleEntries(bundle: fhir.Bundle, queryParams: ValidQuery, logger: pino.Logger): void {
  const originalTotal = bundle.total
  const filteredEntries = bundle.entry.filter(entry =>
    isTask(entry.resource)
    && matchesQuery(entry.resource, queryParams)
  )
  bundle.entry = filteredEntries
  bundle.total = filteredEntries.length
  logger.info(`Results from Spine: ${originalTotal}. Results after filtering: ${bundle.total}.`)
}

export function matchesQuery(task: fhir.Task, queryParams: ValidQuery): boolean {
  return queryParamDefinitions.every(definition => {
    const rawValue = queryParams[definition.name]
    return !rawValue || toArray(rawValue).map(getValue).every(value => definition.test(task, value))
  })
}

export function getValue(rawValue: string): string {
  const pipeIndex = rawValue?.indexOf("|") || -1
  if (pipeIndex !== -1) {
    return rawValue.substring(pipeIndex + 1)
  }
  return rawValue
}

export function getSystem(rawValue: string): string {
  const pipeIndex = rawValue?.indexOf("|") || -1
  if (pipeIndex !== -1) {
    return rawValue.substring(0, pipeIndex)
  }
  return undefined
}

export function getEarliestDate(dateParameterValues: Array<string>): string {
  return dateParameterValues.find(value => value.startsWith("eq") || value.startsWith("ge"))?.substring(2)
}

export function getLatestDate(dateParameterValues: Array<string>): string {
  return dateParameterValues.find(value => value.startsWith("eq") || value.startsWith("le"))?.substring(2)
}

export function toSpineDateFormat(date: string): string {
  return date ? moment.utc(date, true).format("YYYYMMDD") : date
}

export function testDate(actualValueStr: string, value: string): boolean {
  const actualValue = moment.utc(actualValueStr, true)
  const searchValue = moment.utc(value.substring(2), true)
  if (value.startsWith("eq")) {
    return actualValue.isSame(searchValue, "d")
  } else if (value.startsWith("le")) {
    return actualValue.isSameOrBefore(searchValue, "d")
  } else if (value.startsWith("ge")) {
    return actualValue.isSameOrAfter(searchValue, "d")
  } else {
    throw new Error("Unhandled comparator")
  }
}
