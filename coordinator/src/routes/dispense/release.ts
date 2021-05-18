import * as Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, externalValidator, getPayload, handleResponse} from "../util"
import {fhir} from "@models"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import * as parametersValidator from "../../services/validation/parameters-validator"
import {RequestHeaders} from "../../services/headers"

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
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(ContentTypes.FHIR)
        }

        request.logger.info("Building Spine release request")
        const requestId = request.headers[RequestHeaders.REQUEST_ID].toUpperCase()
        const spineRequest = await translator.convertParametersToSpineRequest(parameters, requestId, request.logger)
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
