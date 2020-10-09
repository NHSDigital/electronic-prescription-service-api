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

export function validatingHandler(requireSignature: boolean, handler: Handler<fhir.Bundle>) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const fhirValidation = await axios.post(
      "http://localhost:9001/$validate",
      request.payload.toString(),
      {
        headers: request.headers
      }
    )
    if (fhirValidation) {
      if (!isOperationOutcome(fhirValidation)) {
        throw new TypeError("Expected an OperationOutcome from validator but got " + JSON.stringify(fhirValidation))
      }
      const errors = fhirValidation.issue.filter(issue => issue.severity === "error" || issue.severity === "fatal")
      if (errors) {
        return responseToolkit.response(fhirValidation).code(400)
      }
    }

    const requestPayload = getPayload(request)
    const validation = requestValidator.verifyBundle(requestPayload, requireSignature)
    if (validation.length > 0) {
      const response = toFhirError(validation)
      const statusCode = requestValidator.getStatusCode(validation)
      return responseToolkit.response(response).code(statusCode)
    }

    const validatedPayload = requestPayload as fhir.Bundle
    return handler(validatedPayload, request, responseToolkit)
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
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
        version: "1",
        code: ve.apiErrorCode,
        display: ve.message
      }]
    }
  })

  return {
    resourceType: "OperationOutcome",
    issue: validation.map(mapValidationErrorToOperationOutcomeIssue)
  }
}
