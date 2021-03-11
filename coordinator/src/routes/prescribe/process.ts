import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import Hapi from "@hapi/hapi"
import {basePath, createHash, handleResponse, validatingHandler} from "../util"
import * as fhir from "../../models/fhir"
import * as bundleValidator from "../../services/validation/bundle-validator"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: `${basePath}/$process-message`,
    handler: validatingHandler(
      async (bundle: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Building Spine request")
        const spineRequest = translator.convertBundleToSpineRequest(
          bundle,
          request.headers["nhsd-request-id"].toUpperCase()
        )

      const bundle = getPayload(request) as fhir.Bundle
      const issues = bundleValidator.verifyBundle(bundle)
      if (issues.length) {
        return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
      }

      if (isDispenseMessage(bundle)) {
        return responseToolkit.response({
          resourceType: "OperationOutcome",
          issue: [{
            code: "informational",
            severity: "information"
          }]
        }).code(200).type(CONTENT_TYPE_FHIR)
      }

      request.logger.info("Building Spine request")
      const requestId = request.headers["nhsd-request-id"].toUpperCase()
      const spineRequest = translator.convertBundleToSpineRequest(bundle, requestId)
      request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
      const spineResponse = await spineClient.send(spineRequest, request.logger)
      return handleResponse(request, spineResponse, responseToolkit)
    }
  } as Hapi.ServerRoute
]
