import * as Hapi from "@hapi/hapi"
import {BASE_PATH, CONTENT_TYPE_FHIR, getFhirValidatorErrors, getPayload, handleResponse} from "../util"
import * as fhir from "../../models/fhir"
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
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
      const fhirValidatorResponse = await getFhirValidatorErrors(request)
      if (fhirValidatorResponse) {
        return responseToolkit.response(fhirValidatorResponse).code(400).type(CONTENT_TYPE_FHIR)
      }

      const withdrawPayload = getPayload(request) as fhir.Task
      const issues = taskValidator.verifyTask(withdrawPayload)
      if (issues.length) {
        return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
      }

      request.logger.info("Building Spine release request")
      const requestId = request.headers["nhsd-request-id"].toUpperCase()
      const spineRequest = await translator.convertTaskWithdrawToSpineRequest(withdrawPayload, requestId)
      const spineResponse = await spineClient.send(spineRequest, request.logger)
      return handleResponse(request, spineResponse, responseToolkit)
    }

  } as Hapi.ServerRoute
]
