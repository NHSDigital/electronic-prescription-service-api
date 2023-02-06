import * as translator from "../services/translation/request"
import {spineClient} from "../services/communication/spine-client"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  createHash,
  externalValidator,
  getPayload,
  handleResponse
} from "./util"
import {fhir} from "@models"
import * as bundleValidator from "../services/validation/bundle-validator"
import {getScope, getSdsRoleProfileId, getSdsUserUniqueId} from "../utils/headers"
import {getStatusCode} from "../utils/status-code"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$process-message`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const bundle = getPayload(request) as fhir.Bundle
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})

        const scope = getScope(request.headers)
        const accessTokenSDSUserID = getSdsUserUniqueId(request.headers)
        const accessTokenSDSRoleID = getSdsRoleProfileId(request.headers)

        const issues = bundleValidator.verifyBundle(bundle, scope, accessTokenSDSUserID, accessTokenSDSRoleID)
        if (issues.length) {
          const response = fhir.createOperationOutcome(issues)
          const statusCode = getStatusCode(issues)
          return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
        }

        request.logger.info("Building Spine request")
        const spineRequest = await translator.convertBundleToSpineRequest(bundle, request.headers, request.logger)
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return await handleResponse(request, spineResponse, responseToolkit)
      }
    )
  }
]
