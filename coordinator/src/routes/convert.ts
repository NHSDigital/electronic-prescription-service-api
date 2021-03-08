import {convertBundleToSpineRequest, convertParametersToSpineRequest} from "../services/translation/request"
import Hapi from "@hapi/hapi"
import {basePath, bundleValidation, externalFHIRValidation, getPayload, toFhirError} from "./util"
import * as fhir from "../models/fhir"
import {ResourceTypeError} from "../models/errors/validation-errors"
import {SpineRequest} from "../models/spine"

const CONTENT_TYPE_XML = "application/xml"
const CONTENT_TYPE_PLAIN_TEXT = "text/plain"

export default [
  /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
  {
    method: "POST",
    path: `${basePath}/$convert`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const fhirPayload = getPayload(request) as fhir.Resource

      const isSmokeTest = request.headers["x-smoke-test"]
      const contentType = isSmokeTest ? CONTENT_TYPE_PLAIN_TEXT : CONTENT_TYPE_XML

      if (fhirPayload.resourceType != "Bundle" && fhirPayload.resourceType != "Parameters") {
        return responseToolkit
          .response(toFhirError([new ResourceTypeError("Bundle or Parameters")]))
          .code(400)
          .header("Content-Type", contentType)
      }

      let validationHandler
      let translationFunction: (resource: fhir.Resource, messageId: string) => SpineRequest
      if (fhirPayload.resourceType == "Bundle") {
        validationHandler = bundleValidation
        translationFunction = convertBundleToSpineRequest
      } else if (fhirPayload.resourceType == "Parameters") {
        validationHandler = parametersValidation
        translationFunction = convertParametersToSpineRequest
      }
      return responseToolkit.response(validationHandler(
        (resource: fhir.Resource, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
          request.logger.info("Building HL7V3 message")
          return responseToolkit
            .response(translationFunction(resource, request.headers["nhsd-request-id"].toUpperCase()).message)
            .code(200)
            .header("Content-Type", contentType)
        }))
    }
  } as Hapi.ServerRoute
]

type Handler<T> = (
  requestPayload: T, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => Hapi.ResponseObject | Promise<Hapi.ResponseObject>

export function parametersValidation(handler: Handler<fhir.Parameters>) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const fhirValidatorResponse = await externalFHIRValidation(request)
    if (fhirValidatorResponse.issue.length > 0) {
      return responseToolkit.response(fhirValidatorResponse).code(400)
    }
    return handler(getPayload(request) as fhir.Parameters, request, responseToolkit)
  }

}
