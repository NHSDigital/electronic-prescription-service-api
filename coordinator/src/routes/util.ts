import {fhir, spine} from "@models"
import Hapi from "@hapi/hapi"
import {translateToFhir} from "../services/translation/response"
import * as LosslessJson from "lossless-json"
import axios from "axios"
import stream from "stream"
import * as crypto from "crypto-js"
import {RequestHeaders} from "../services/headers"
import {isBundle, isOperationOutcome} from "./type-guards"

type HapiPayload = string | object | Buffer | stream //eslint-disable-line @typescript-eslint/ban-types

export enum ContentTypes {
  XML = "application/xml",
  PLAIN_TEXT = "text/plain",
  FHIR = "application/fhir+json; fhirVersion=4.0",
  JSON = "application/json"
}
export const VALIDATOR_HOST = "http://localhost:9001"
export const BASE_PATH = "/FHIR/R4"

export function createHash(thingsToHash: string): string {
  return crypto.SHA256(thingsToHash).toString()
}

export function handleResponse<T>(
  request: Hapi.Request,
  spineResponse: spine.SpineDirectResponse<T> | spine.SpinePollableResponse,
  responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject {
  if (spine.isPollable(spineResponse)) {
    return responseToolkit.response()
      .code(spineResponse.statusCode)
      .header("Content-Location", spineResponse.pollingUrl)
  } else if (isOperationOutcome(spineResponse.body) || isBundle(spineResponse.body)) {
    return responseToolkit.response(spineResponse.body)
      .code(spineResponse.statusCode)
      .type(ContentTypes.FHIR)
  } else {
    if (request.headers[RequestHeaders.RAW_RESPONSE]) {
      return responseToolkit
        .response(spineResponse.body.toString())
        .code(200)
        .type(ContentTypes.XML)
    } else {
      const translatedSpineResponse = translateToFhir(spineResponse, request.logger)
      const serializedResponse = LosslessJson.stringify(translatedSpineResponse.fhirResponse)
      return responseToolkit.response(serializedResponse)
        .code(translatedSpineResponse.statusCode)
        .type(ContentTypes.FHIR)
    }
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

export async function getFhirValidatorErrors(
  request: Hapi.Request
): Promise<fhir.OperationOutcome> {
  if (request.headers[RequestHeaders.SKIP_VALIDATION]) {
    request.logger.info("Skipping call to FHIR validator")
  } else {
    request.logger.info("Making call to FHIR validator")
    const validatorResponseData = await callFhirValidator(request.payload, request.headers)
    request.logger.info("Received response from FHIR validator")
    const error = validatorResponseData.issue.find(issue => issue.severity === "error" || issue.severity === "fatal")
    if (error) {
      return validatorResponseData
    }
  }
  return null
}

export function externalValidator(handler: Hapi.Lifecycle.Method) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.Lifecycle.ReturnValue> => {
    const fhirValidatorResponse = await getFhirValidatorErrors(request)
    if (fhirValidatorResponse) {
      return responseToolkit.response(fhirValidatorResponse).code(400).type(ContentTypes.FHIR)
    }

    return handler(request, responseToolkit)
  }
}

export function getPayload(request: Hapi.Request): unknown {
  request.logger.info("Parsing request payload")
  if (Buffer.isBuffer(request.payload)) {
    return LosslessJson.parse(request.payload.toString())
  } else if (typeof request.payload === "string") {
    return LosslessJson.parse(request.payload)
  } else {
    return {}
  }
}
