import * as translator from "../services/translation/request"
import {spineClient} from "../services/communication/spine-client"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  CONTENT_TYPE_FHIR,
  createHash, externalValidator,
  getPayload,
  handleResponse,
  userAuthValidator
} from "./util"
import * as fhir from "../models/fhir"
import * as bundleValidator from "../services/validation/bundle-validator"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$process-message`,
    handler: userAuthValidator(externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const bundle = getPayload(request) as fhir.Bundle
        const issues = bundleValidator.verifyBundle(bundle)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building Spine request")
        const requestId = request.headers["nhsd-request-id"].toUpperCase()
        const spineRequest = await translator.convertBundleToSpineRequest(bundle, requestId, request.logger)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    ))
  } as Hapi.ServerRoute
]
