import * as Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload,
  handleResponse
} from "../util"
import {fhir} from "@models"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import * as taskValidator from "../../services/validation/task-validator"
import {getScope} from "../../utils/headers"
import {getStatusCode} from "../../utils/status-code"
import {getLogger} from "../../services/logging/logger"

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: `${BASE_PATH}/Task`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const taskPayload = getPayload(request) as fhir.Task
        const scope = getScope(request.headers)
        const issues = taskValidator.verifyTask(taskPayload, scope)
        if (issues.length) {
          const response = fhir.createOperationOutcome(issues)
          const statusCode = getStatusCode(issues)
          return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
        }
        const logger = getLogger(request.logger)
        logger.info("Building Spine return / withdraw request")
        const spineRequest = translator.convertTaskToSpineRequest(taskPayload, request.headers)
        const spineResponse = await spineClient.send(spineRequest, logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  }
]
