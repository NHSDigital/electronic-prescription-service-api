import * as Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, externalValidator, getPayload, handleResponse} from "../util"
import {fhir} from "@models"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import * as parametersValidator from "../../services/validation/parameters-validator"
import {getScope} from "../../utils/headers"
import {getStatusCode} from "../../utils/status-code"

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
        const scope = getScope(request.headers)
        const issues = parametersValidator.verifyParameters(parameters, scope)
        if (issues.length) {
          const response = fhir.createOperationOutcome(issues)
          const statusCode = getStatusCode(issues)
          return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
        }

        request.logger.info("Building Spine release request")
        const spineRequest = await translator.convertParametersToSpineRequest(
          parameters,
          request.headers,
          request.logger
        )
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  }
]
