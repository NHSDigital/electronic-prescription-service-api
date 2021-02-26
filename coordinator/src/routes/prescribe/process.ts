import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication"
import Hapi from "@hapi/hapi"
import {basePath, createHash, handleResponse, validatingHandler} from "../util"
import {getMessageHeader} from "../../services/translation/common/getResourcesOfType"
import * as fhir from "../../models/fhir"

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
            issue: [{
              code: "informational",
              severity: "information"
            }]
          }).code(200)
        }
        request.logger.info("Building Spine request")
        const spineRequest = translator.convertBundleToSpineRequest(bundle)
        spineRequest.messageId = request.headers["nhsd-request-id"].toUpperCase()
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
        const spineResponse = await spineClient.send(
          spineRequest,
          request.logger
        )
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
