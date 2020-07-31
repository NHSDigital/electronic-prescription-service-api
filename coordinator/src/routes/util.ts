import {isPollable, SpineDirectResponse, SpinePollableResponse} from "../services/spine-communication";
import Hapi from "@hapi/hapi"
import {Bundle, OperationOutcome} from "../model/fhir-resources";
import * as requestValidator from "../validators/request-validator";
import {ValidationError} from "../validators/request-validator";

export function handlePollableResponse(spineResponse: SpineDirectResponse | SpinePollableResponse, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject {
    if (isPollable(spineResponse)) {
        return responseToolkit.response()
          .code(spineResponse.statusCode)
          .header('Content-Location', spineResponse.pollingUrl)
    } else {
        return responseToolkit.response(spineResponse.body)
          .code(spineResponse.statusCode)
          .header('Content-Type', 'multipart/mixed; boundary=----=_MIME-Boundary')
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
    return handler(requestPayload as Bundle, responseToolkit);
  }
}

function getPayload(request: Hapi.Request): unknown {
  return request.payload || {}
}

function toFhirError(validation: Array<ValidationError>): OperationOutcome {
  /* Reformat errors to FHIR spec
    * v.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
    * v.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
  */
  return {
    resourceType: "OperationOutcome",
    issue: validation.map(v => {
      return {
        severity: v.severity,
        code: v.operationOutcomeCode,
        details: {
          coding: [{
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: 1,
            code: v.apiErrorCode,
            display: v.message
          }]
        }
      }
    })
  }
}
