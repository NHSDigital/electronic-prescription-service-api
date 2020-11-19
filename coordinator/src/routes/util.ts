import {isPollable, SpineDirectResponse, SpinePollableResponse} from "../models/spine"
import Hapi from "@hapi/hapi"
import * as fhir from "../models/fhir/fhir-resources"
import {OperationOutcome, Resource} from "../models/fhir/fhir-resources"
import * as requestValidator from "../services/validation/bundle-validator"
import * as errors from "../models/errors/validation-errors"
import {wrapInOperationOutcome} from "../services/translation/common"
import * as LosslessJson from "lossless-json"
import {getMessageHeader} from "../services/translation/common/getResourcesOfType"
import axios from "axios"
import stream from "stream"

type HapiPayload = string | object | Buffer | stream //eslint-disable-line @typescript-eslint/ban-types

export function handleResponse<T>(
  spineResponse: SpineDirectResponse<T> | SpinePollableResponse,
  responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject {
  if (isPollable(spineResponse)) {
    return responseToolkit.response()
      .code(spineResponse.statusCode)
      .header("Content-Location", spineResponse.pollingUrl)
  } else {
    return responseToolkit.response(asOperationOutcome(spineResponse))
      .code(spineResponse.statusCode)
      .header("Content-Type", "application/fhir+json; fhirVersion=4.0")
  }
}

export function asOperationOutcome<T>(spineResponse: SpineDirectResponse<T>): OperationOutcome {
  if (isOperationOutcome(spineResponse.body)) {
    return spineResponse.body
  } else {
    return wrapInOperationOutcome(spineResponse)
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
  requestHeaders: Hapi.Util.Dictionary<string>): Promise<fhir.OperationOutcome> {
  const validatorResponse = await axios.post(
    "http://localhost:9002/$validate",
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
    const validatorResponseData = await fhirValidation(request.payload, request.headers)

    const error = validatorResponseData.issue.find(issue => issue.severity === "error" || issue.severity === "fatal")
    if (error) {
      return responseToolkit.response(validatorResponseData).code(400)
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
