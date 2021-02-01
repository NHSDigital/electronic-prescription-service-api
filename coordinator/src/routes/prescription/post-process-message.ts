import * as translator from "../../services/translation"
import * as fhir from "../../models/fhir/fhir-resources"
import {requestHandler} from "../../services/handlers"
import Hapi from "@hapi/hapi"
import {createHash, handleResponse, validatingHandler} from "../util"
import {createOperationOutcomeIssue} from "../../services/translation/spine-response"
import {getMessageHeader} from "../../services/translation/common/getResourcesOfType"

const sandboxDispenseNotificationResponse: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [createOperationOutcomeIssue(200)]
}

function isDispenseMessage(bundle: fhir.Bundle) {
  return getMessageHeader(bundle).eventCoding.code === "prescription-dispense"
}

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: "/$process-message",
    handler: validatingHandler(
      async (bundle: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        if (isDispenseMessage(bundle)) {
          return responseToolkit.response(sandboxDispenseNotificationResponse).code(200)
        }
        request.logger.info("Building Spine request")
        const spineRequest = translator.convertFhirMessageToSpineRequest(bundle)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
        request.logger.info("Awaiting response")
        const spineResponse = await requestHandler.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
