import * as translator from "../services/translation/request"
import {spineClient} from "../services/communication/spine-client"
import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload,
  handleResponse
} from "./util"
import {createHash} from "./create-hash"
import {fhir} from "@models"
import * as bundleValidator from "../services/validation/bundle-validator"
import {
  getAsid,
  getScope,
  getSdsRoleProfileId,
  getSdsUserUniqueId
} from "../utils/headers"
import {getStatusCode} from "../utils/status-code"
import {HashingAlgorithm} from "../services/translation/common/hashingAlgorithm"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST" as RouteDefMethods,
    path: `${BASE_PATH}/$process-message`,
    handler: externalValidator(async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
      request.log("info", `TS Processing $process-message request to ${JSON.stringify(request.url)}`)
      const bundle = await getPayload(request) as fhir.Bundle
      request.log("audit", {incomingMessageHash: createHash(JSON.stringify(bundle), HashingAlgorithm.SHA256)})

      const scope = getScope(request.headers)
      const accessTokenSDSUserID = getSdsUserUniqueId(request.headers)
      const accessTokenSDSRoleID = getSdsRoleProfileId(request.headers)

      const issues = bundleValidator.verifyBundle(
        bundle,
        scope,
        accessTokenSDSUserID,
        accessTokenSDSRoleID,
        request.logger
      )
      if (issues.length) {
        const response = fhir.createOperationOutcome(issues, bundle.meta?.lastUpdated)
        const statusCode = getStatusCode(issues)
        return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
      }

      request.logger.info("TS Building Spine request")
      const spineRequest = await translator.convertBundleToSpineRequest(bundle, request.headers, request.logger)
      request.logger.info(`TS Request built, sending to Spine: ${JSON.stringify(spineRequest)}`)
      const spineResponse = await spineClient.send(spineRequest, getAsid(request.headers), request.logger)
      request.logger.info(`TS Received Spine response: ${JSON.stringify(spineResponse)}`)
      const resp = await handleResponse(request, spineResponse, responseToolkit)
      request.logger.info(`TS Returning response to consumer: ${JSON.stringify(resp)}`)
      return resp
    })
  }
]
