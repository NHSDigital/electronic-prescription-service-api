import {fhir, spine} from "@models"
import Hapi from "@hapi/hapi"
import pino from "pino"
import * as LosslessJson from "lossless-json"
import axios from "axios"
import stream from "stream"
import {translateToFhir} from "../services/translation/response"
import {getShowValidationWarnings, RequestHeaders} from "../utils/headers"
import {getPayloadIdentifiers} from "./logging"
import {
  isBundle,
  isClaim,
  isOperationOutcome,
  isParameters,
  isTask
} from "../utils/type-guards"
import axiosRetry from "axios-retry"

type HapiPayload = string | object | Buffer | stream

export enum ContentTypes {
  XML = "application/xml",
  PLAIN_TEXT = "text/plain",
  FHIR = "application/fhir+json; fhirVersion=4.0",
  JSON = "application/json"
}
export const VALIDATOR_HOST = "http://localhost:9001"
export const BASE_PATH = "/FHIR/R4"

axiosRetry(axios, {retries: 3})

export async function handleResponse<T>(
  request: Hapi.Request,
  spineResponse: spine.SpineDirectResponse<T> | spine.SpinePollableResponse,
  responseToolkit: Hapi.ResponseToolkit
): Promise<Hapi.ResponseObject> {
  if (spine.isPollable(spineResponse)) {
    // Spine pollable response
    return responseToolkit
      .response()
      .code(spineResponse.statusCode)
      .header("Content-Location", spineResponse.pollingUrl)
  } else if (isOperationOutcome(spineResponse.body) || isBundle(spineResponse.body)) {
    // FHIR response
    return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode).type(ContentTypes.FHIR)
  } else {
    if (request.headers[RequestHeaders.RAW_RESPONSE]) {
      // Return XML Spine response
      return responseToolkit.response(spineResponse.body.toString()).code(200).type(ContentTypes.XML)
    } else {
      // Translate Spine response to FHIR message
      const translatedSpineResponse = await translateToFhir(spineResponse, request.logger, request.headers)
      const serializedResponse = LosslessJson.stringify(translatedSpineResponse.fhirResponse)
      return responseToolkit
        .response(serializedResponse)
        .code(translatedSpineResponse.statusCode)
        .type(ContentTypes.FHIR)
    }
  }
}

function extractTraceIds(headers: Hapi.Utils.Dictionary<string>): Record<string, string> {
  return {
    "x-request-id": headers["x-request-id"] || headers["nhsd-request-id"],
    "x-amzn-trace-id": headers["x-amzn-trace-id"],
    "nhsd-correlation-id": headers["nhsd-correlation-id"],
    "nhsd-request-id": headers["nhsd-request-id"]
  }
}

const getCircularReplacer = () => {
  const seen = new WeakSet()
  return (key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return
      }
      seen.add(value)
    }
    return value
  }
}

export async function callFhirValidator(
  payload: HapiPayload,
  requestHeaders: Hapi.Utils.Dictionary<string>
): Promise<fhir.OperationOutcome> {
  const validatorResponse = await axios.post(`${VALIDATOR_HOST}/$validate`, payload.toString(), {
    headers: {
      "Content-Type": requestHeaders["content-type"],
      ...extractTraceIds(requestHeaders)
    }
  })

  const validatorResponseData = validatorResponse.data
  if (!validatorResponseData) {
    throw new TypeError("No response from validator")
  }

  if (!isOperationOutcome(validatorResponseData)) {
    throw new TypeError(
      `Unexpected response from validator:\n${JSON.stringify(validatorResponseData, getCircularReplacer())}`
    )
  }
  return validatorResponseData
}

export async function getFhirValidatorErrors(
  request: Hapi.Request,
  showWarnings: boolean
): Promise<fhir.OperationOutcome> {
  if (request.headers[RequestHeaders.SKIP_VALIDATION]) {
    request.logger.info("Skipping call to FHIR validator")
  } else {
    request.logger.info("Making call to FHIR validator")
    const validatorResponseData = await callFhirValidator(request.payload, request.headers)
    request.logger.info("Received response from FHIR validator")
    const filteredResponse = filterValidatorResponse(validatorResponseData, showWarnings)
    if (filteredResponse.issue.length) {
      return validatorResponseData
    }
  }
  return null
}

export function filterValidatorResponse(
  validatorResponse: fhir.OperationOutcome,
  showWarnings: boolean
): fhir.OperationOutcome {
  const issues = validatorResponse.issue

  const noInformation = filterOutSeverity(issues, "information")

  const noWarnings = showWarnings ? noInformation : filterOutSeverity(noInformation, "warning")

  const noMatchingProfileError = filterOutDiagnosticOnString(noWarnings, "Unable to find a match for profile")

  const noNHSNumberVerificationError = filterOutDiagnosticOnString(
    noMatchingProfileError,
    "UKCore-NHSNumberVerificationStatus"
  )

  return {
    ...validatorResponse,
    issue: noNHSNumberVerificationError
  }
}

function filterOutSeverity(issues: Array<fhir.OperationOutcomeIssue>, severity: fhir.IssueSeverity) {
  return issues.filter((issue) => issue.severity !== severity)
}

function filterOutDiagnosticOnString(issues: Array<fhir.OperationOutcomeIssue>, diagnosticString: string) {
  return issues.filter((issue) => !issue.diagnostics?.includes(diagnosticString))
}

export function externalValidator(handler: Hapi.Lifecycle.Method) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.Lifecycle.ReturnValue> => {
    const showWarnings = getShowValidationWarnings(request.headers) === "true"
    const fhirValidatorResponse = await getFhirValidatorErrors(request, showWarnings)
    if (fhirValidatorResponse) {
      request.logger.error(`FHIR validator failed with errors: ${LosslessJson.stringify(fhirValidatorResponse)}`)
      return responseToolkit.response(fhirValidatorResponse).code(400).type(ContentTypes.FHIR)
    }

    return handler.call(this, request, responseToolkit)
  }
}

function createCodeSystemNormalizer(logger: pino.Logger, traceIds: Record<string, string>) {
  return (key: string, value: unknown): unknown => {
    // Only normalize HL7 terminology URIs from https to http
    // NHS FHIR URIs (https://fhir.nhs.uk/...) do use https
    if (key === "system" && typeof value === "string" && value.startsWith("https://terminology.hl7.org/")) { // NOSONAR
      logger.info({
        traceIds,
        originalUrl: value,
        normalizedUrl: value.replace("https://", "http://")
      }, "Normalizing HL7 URIs from https to http")
      return value.replace("https://", "http://")
    }
    return value
  }
}

const parsePayload = (payload: HapiPayload, logger: pino.Logger, traceIds: Record<string, string>): unknown => {
  logger.info("Parsing request payload")
  const normalizeCodeSystemReviver = createCodeSystemNormalizer(logger, traceIds)
  if (Buffer.isBuffer(payload)) {
    return LosslessJson.parse(payload.toString(), normalizeCodeSystemReviver)
  } else if (typeof payload === "string") {
    return LosslessJson.parse(payload, normalizeCodeSystemReviver)
  } else {
    return {}
  }
}

type FhirPayload = fhir.Bundle | fhir.Claim | fhir.Parameters | fhir.Task

export const getPayload = async (request: Hapi.Request): Promise<FhirPayload> => {
  const payload = parsePayload(request.payload, request.logger, extractTraceIds(request.headers))

  if (isBundle(payload) || isClaim(payload) || isParameters(payload) || isTask(payload)) {
    // AEA-2743 - Log identifiers within incoming payloads
    const payloadIdentifiers = await getPayloadIdentifiers(payload)
    request.log("audit", {payloadIdentifiers: payloadIdentifiers})

    return payload
  }

  request.logger.error("Cannot parse payload: unrecognised payload type")
}
