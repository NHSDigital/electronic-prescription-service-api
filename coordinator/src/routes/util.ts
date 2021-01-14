import {isPollable, SpineDirectResponse, SpinePollableResponse} from "../models/spine"
import Hapi from "@hapi/hapi"
import * as fhir from "../models/fhir/fhir-resources"
import {OperationOutcome, Resource} from "../models/fhir/fhir-resources"
import * as requestValidator from "../services/validation/bundle-validator"
import * as errors from "../models/errors/validation-errors"
import {translateToFhir} from "../services/translation/spine-response"
import * as LosslessJson from "lossless-json"
import {getMessageHeader} from "../services/translation/common/getResourcesOfType"
import axios from "axios"
import stream from "stream"
import {requestHandler} from "../services/handlers"
import {Logger} from "pino"

type HapiPayload = string | object | Buffer | stream //eslint-disable-line @typescript-eslint/ban-types

const CONTENT_TYPE_FHIR = "application/fhir+json; fhirVersion=4.0"
const CONTENT_TYPE_JSON = "application/json"

export const VALIDATOR_HOST = "http://localhost:9001"

const INITIAL_DELAY_MILLIS = 250
const MAX_DELAY_MILLIS = 5000
const TIMEOUT_MILLIS = 29000

export async function handleResponse(
  request: Hapi.Request,
  spineResponse: SpineDirectResponse<unknown> | SpinePollableResponse,
  responseToolkit: Hapi.ResponseToolkit
): Promise<Hapi.ResponseObject> {
  const isSmokeTest = request.headers["x-smoke-test"]
  const respondAsync = request.headers["prefer"] === "respond-async"
  const contentType = isSmokeTest ? CONTENT_TYPE_JSON : CONTENT_TYPE_FHIR

  if (isPollable(spineResponse)) {
    if (respondAsync) {
      return responseToolkit.response()
        .code(spineResponse.statusCode)
        .header("Content-Location", `${process.env.BASE_PATH}${spineResponse.pollingUrl}`)
    }
    const pollEndTime = new Date().getTime() + TIMEOUT_MILLIS
    spineResponse = await pollForResponse(spineResponse.pollingUrl, INITIAL_DELAY_MILLIS, pollEndTime, request.logger)
  }

  if (isOperationOutcome(spineResponse.body)) {
    return responseToolkit.response(spineResponse.body)
      .code(spineResponse.statusCode)
      .header("Content-Type", contentType)
  } else {
    const translatedSpineResponse = translateToFhir(spineResponse)
    return responseToolkit.response(translatedSpineResponse.fhirResponse)
      .code(translatedSpineResponse.statusCode)
      .header("Content-Type", contentType)
  }
}

function isOperationOutcome(body: unknown): body is OperationOutcome {
  return typeof body === "object"
    && "resourceType" in body
    && (body as Resource).resourceType === "OperationOutcome"
}

type Handler<T> = (
  requestPayload: T, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => Hapi.ResponseObject | Promise<Hapi.ResponseObject>

export enum MessageType {
  PRESCRIPTION = "prescription-order",
  CANCELLATION = "prescription-order-update"
}

export function identifyMessageType(bundle: fhir.Bundle): string {
  return getMessageHeader(bundle).eventCoding?.code
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

export async function fhirValidation(
  payload: HapiPayload,
  requestHeaders: Hapi.Util.Dictionary<string>
): Promise<fhir.OperationOutcome> {
  const validatorResponse = await axios.post(
    `${VALIDATOR_HOST}/$validate`,
    payload.toString(),
    {
      headers: {
        "Content-Type": requestHeaders["content-type"]
      }
    }
  )

  const validatorResponseData = validatorResponse.data
  if (!validatorResponseData) {
    throw new TypeError("No response from validator")
  }

  if (!isOperationOutcome(validatorResponseData)) {
    throw new TypeError(`Unexpected response from validator:\n${
      JSON.stringify(validatorResponseData, getCircularReplacer())
    }`)
  }
  return validatorResponseData
}

export function validatingHandler(handler: Handler<fhir.Bundle>) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    if (request.headers["x-skip-validation"]) {
      request.logger.info("Skipping call to FHIR validator")
    } else {
      request.logger.info("Making call to FHIR validator")
      const validatorResponseData = await fhirValidation(request.payload, request.headers)
      request.logger.info("Received response from FHIR validator")
      const error = validatorResponseData.issue.find(issue => issue.severity === "error" || issue.severity === "fatal")
      if (error) {
        return responseToolkit.response(validatorResponseData).code(400)
      }
    }

    const requestPayload = getPayload(request) as fhir.Bundle
    const validation = requestValidator.verifyBundle(requestPayload)
    if (validation.length > 0) {
      const response = toFhirError(validation)
      const statusCode = requestValidator.getStatusCode(validation)
      return responseToolkit.response(response).code(statusCode)
    }
    return handler(requestPayload, request, responseToolkit)
  }
}

function getPayload(request: Hapi.Request): unknown {
  request.logger.info("Parsing request payload")
  if (Buffer.isBuffer(request.payload)) {
    return LosslessJson.parse(request.payload.toString())
  } else if (typeof request.payload === "string") {
    return LosslessJson.parse(request.payload)
  } else {
    return {}
  }
}

function toFhirError(validation: Array<errors.ValidationError>): fhir.OperationOutcome {
  /* Reformat errors to FHIR spec
    * v.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
    * v.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
  */
  const mapValidationErrorToOperationOutcomeIssue = (ve: errors.ValidationError) => ({
    severity: ve.severity,
    code: ve.operationOutcomeCode,
    diagnostics: ve.message,
    expression: ve.expression
  })

  return {
    resourceType: "OperationOutcome",
    issue: validation.map(mapValidationErrorToOperationOutcomeIssue)
  }
}

function sleep(durationMillis: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMillis))
}

async function pollForResponse(
  pollingUrl: string,
  delay: number,
  endTime: number,
  logger: Logger
): Promise<SpineDirectResponse<unknown>> {
  await sleep(delay)
  const spineResponse = await requestHandler.poll(pollingUrl, logger)
  if (!isPollable(spineResponse)) {
    return spineResponse
  }

  const newDelay = Math.min(delay * 2, MAX_DELAY_MILLIS)
  if (new Date().getTime() + newDelay > endTime) {
    return {
      body: {
        resourceType: "OperationOutcome",
        issue: [{
          severity: "fatal",
          code: "value"
        }]
      },
      statusCode: 504
    }
  }
  return pollForResponse(spineResponse.pollingUrl || pollingUrl, newDelay, endTime, logger)
}
