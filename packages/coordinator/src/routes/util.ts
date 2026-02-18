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
import "../types/hapi-extensions"

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
  requestHeaders: Hapi.Utils.Dictionary<string>,
  logger: pino.Logger = null
): Promise<fhir.OperationOutcome> {
  // Payload is already normalised if it went through externalValidator or getPayload
  const payloadString = typeof payload === "string" || Buffer.isBuffer(payload)
    ? payload.toString()
    : JSON.stringify(payload)

  if (logger) {
    logger.info("Sending payload to FHIR validator")
  }

  const validatorResponse = await axios.post(`${VALIDATOR_HOST}/$validate`, payloadString, {
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
    // Use the already-parsed and normalised payload if available, otherwise use raw payload
    const payload = request.app.parsedPayload ?? request.payload
    const validatorResponseData = await callFhirValidator(payload as HapiPayload, request.headers, request.logger)
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
    const parsedPayload = parsePayload(request.payload, request.logger, extractTraceIds(request.headers))

    // keep payload for reuse in the handler
    request.app.parsedPayload = parsedPayload

    const showWarnings = getShowValidationWarnings(request.headers) === "true"
    const fhirValidatorResponse = await getFhirValidatorErrors(request, showWarnings)
    if (fhirValidatorResponse) {
      request.logger.error(`FHIR validator failed with errors: ${LosslessJson.stringify(fhirValidatorResponse)}`)
      return responseToolkit.response(fhirValidatorResponse).code(400).type(ContentTypes.FHIR)
    }

    return handler.call(this, request, responseToolkit)
  }
}

function createUriNormaliser(logger: pino.Logger, traceIds: Record<string, string>) {
  return (key: string, value: unknown): unknown => {
    // Only normalise HL7 terminology URIs from https to http
    // NHS FHIR URIs (https://fhir.nhs.uk/...) do use https
    if (key === "system" && typeof value === "string"
      && (value.startsWith("https://terminology.hl7.org/")
        || value.startsWith("https://hl7.org/fhir/CodeSystem"))) {
      const originalUrl = value
      const normalisedUrl = value.replace("https://terminology.hl7.org/", "http://terminology.hl7.org/") // NOSONAR
        .replace("https://hl7.org/fhir/CodeSystem", "http://hl7.org/fhir/CodeSystem") // NOSONAR
      logger.info({traceIds, originalUrl, normalisedUrl},
        "Normalizing HL7 URIs from https to http")
      return normalisedUrl
    } else {
      logger.info({
        traceIds,
        originalUrl: value
      }, "No need to normalise HL7 URIs from https to http")
    }
    return value
  }
}

const parsePayload = (payload: HapiPayload, logger: pino.Logger, traceIds: Record<string, string>): unknown => {
  logger.info("Parsing request payload")
  const normaliseUriReviver = createUriNormaliser(logger, traceIds)
  if (Buffer.isBuffer(payload)) {
    return LosslessJson.parse(payload.toString(), normaliseUriReviver)
  } else if (typeof payload === "string") {
    return LosslessJson.parse(payload, normaliseUriReviver)
  } else {
    return {}
  }
}

type FhirPayload = fhir.Bundle | fhir.Claim | fhir.Parameters | fhir.Task

export const getPayload = async (request: Hapi.Request): Promise<FhirPayload> => {
  // Reuse the parsed payload from externalValidator if available
  const payload = request.app.parsedPayload ?? parsePayload(
    request.payload,
    request.logger,
    extractTraceIds(request.headers)
  )

  if (isBundle(payload) || isClaim(payload) || isParameters(payload) || isTask(payload)) {
    // AEA-2743 - Log identifiers within incoming payloads
    const payloadIdentifiers = await getPayloadIdentifiers(payload)
    request.log("audit", {payloadIdentifiers: payloadIdentifiers})

    return payload
  }

  request.logger.error("Cannot parse payload: unrecognised payload type")
}
