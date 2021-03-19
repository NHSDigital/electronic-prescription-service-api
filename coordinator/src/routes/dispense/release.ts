import * as Hapi from "@hapi/hapi"
import {
  BASE_PATH, CONTENT_TYPE_FHIR,
  externalValidator, getPayload, handleResponse
} from "../util"
import * as fhir from "../../models/fhir"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import * as parametersValidator from "../../services/validation/parameters-validator"

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: `${BASE_PATH}/Task/$release`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const parameters = getPayload(request) as fhir.Parameters
        const issues = parametersValidator.verifyParameters(parameters)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building Spine release request")
        const requestId = request.headers["nhsd-request-id"].toUpperCase()
        const spineRequest = await translator.convertParametersToSpineRequest(parameters, requestId, request.logger)
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
