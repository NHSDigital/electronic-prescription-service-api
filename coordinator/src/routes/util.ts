import {isPollable, SpineDirectResponse, SpinePollableResponse} from "../models/spine/responses"
import Hapi from "@hapi/hapi"
import {Bundle, OperationOutcome} from "../models/fhir/fhir-resources"
import * as requestValidator from "../services/validation/bundle-validator"
import {ValidationError} from "../models/errors/validation-errors"
import {wrapInOperationOutcome} from "../services/translation/common"
import * as LosslessJson from "lossless-json"

export function handleResponse(spineResponse: SpineDirectResponse | SpinePollableResponse, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject {
  if (isPollable(spineResponse)) {
    return responseToolkit.response()
      .code(spineResponse.statusCode)
      .header("Content-Location", spineResponse.pollingUrl)
  } else {
    return responseToolkit.response(wrapInOperationOutcome(spineResponse))
      .code(spineResponse.statusCode)
      .header("Content-Type", "application/fhir+json; fhirVersion=4.0")
  }
}

type Handler<T> = (requestPayload: T, responseToolkit: Hapi.ResponseToolkit) => Hapi.ResponseObject | Promise<Hapi.ResponseObject>

export function validatingHandler(requireSignature: boolean, handler: Handler<Bundle>) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const requestPayload = getPayload(request)
    const validation = requestValidator.verifyPrescriptionBundle(requestPayload, requireSignature)
    if (validation.length > 0) {
      const response = toFhirError(validation)
      const statusCode = requestValidator.getStatusCode(validation)
      return responseToolkit.response(response).code(statusCode)
    }
    return handler(requestPayload as Bundle, responseToolkit)
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

function toFhirError(validation: Array<ValidationError>): OperationOutcome {
  /* Reformat errors to FHIR spec
    * v.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
    * v.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
  */
  const mapValidationErrorToOperationOutcomeIssue = (ve: ValidationError) => ({
    severity: ve.severity,
    code: ve.operationOutcomeCode,
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
        version: 1,
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
