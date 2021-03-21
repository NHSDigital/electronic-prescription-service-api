import * as Hapi from "@hapi/hapi"
import {BASE_PATH, CONTENT_TYPE_FHIR, externalValidator, getPayload, handleResponse} from "../util"
import * as fhir from "@models/fhir"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import * as taskValidator from "../../services/validation/task-validator"

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
        const issues = taskValidator.verifyTask(taskPayload)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building Spine return / withdraw request")
        const requestId = request.headers["nhsd-request-id"].toUpperCase()
        const spineRequest = await translator.convertTaskToSpineRequest(taskPayload, requestId, request.logger)
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
