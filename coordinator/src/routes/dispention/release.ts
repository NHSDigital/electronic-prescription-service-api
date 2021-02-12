import * as fhir from "../../models/fhir/fhir-resources"
import * as Hapi from "@hapi/hapi"
import {basePath, externalFHIRValidation, getPayload, toFhirError, handleResponse} from "../util"
import {ResourceTypeError} from "../../models/errors/validation-errors"
import * as translator from "../../services/translation"
import {requestHandler} from "../../services/handlers"

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: `${basePath}/Task/$release`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
      const fhirValidatorResponse = await externalFHIRValidation(request)
      if (fhirValidatorResponse.issue.length > 0) {
        return responseToolkit.response(fhirValidatorResponse).code(400)
      }

      const requestPayload = getPayload(request) as fhir.Resource

      if (requestPayload.resourceType !== "Parameters") {
        return responseToolkit
          .response(toFhirError([new ResourceTypeError("Parameters")]))
          .code(400)
      }

      const payloadAsParameters = requestPayload as fhir.Parameters

      request.logger.info("Building Spine release request")
      const spineRequest = translator.convertFhirMessageToReleaseRequest(payloadAsParameters)
      spineRequest.messageId = request.headers["nhsd-request-id"].toUpperCase()

      request.logger.info("Awaiting response")
      const spineResponse = await requestHandler.send(
        spineRequest,
        request.logger
      )

      return handleResponse(request, spineResponse, responseToolkit)
    }

  } as Hapi.ServerRoute
]
