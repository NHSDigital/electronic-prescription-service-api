import * as translator from "../../services/translation/request"
import * as fhir from "../../models/fhir/fhir-resources"
import {spineClient} from "../../services/communication"
import Hapi from "@hapi/hapi"
import {basePath, createHash, handleResponse, validatingHandler} from "../util"
import {createOperationOutcomeIssue} from "../../services/translation/response"
import {getMessageHeader} from "../../services/translation/common/getResourcesOfType"

function isDispenseMessage(bundle: fhir.Bundle) {
  return getMessageHeader(bundle).eventCoding.code === "prescription-dispense"
}

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: `${basePath}/$process-message`,
    handler: validatingHandler(
      async (bundle: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        if (isDispenseMessage(bundle)) {
          return responseToolkit.response({
            resourceType: "OperationOutcome",
            issue: [createOperationOutcomeIssue(200)]
          }).code(200)
        }
        request.logger.info("Building Spine request")
        const spineRequest = translator.convertFhirMessageToSpineRequest(bundle)
        spineRequest.messageId = request.headers["nhsd-request-id"].toUpperCase()
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
        request.logger.info("Awaiting response")
        const spineResponse = await spineClient.send(
          spineRequest,
          request.logger
        )
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
