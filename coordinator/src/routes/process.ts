import * as translator from "../services/translation/request"
import {spineClient} from "../services/communication/spine-client"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  CONTENT_TYPE_FHIR,
  createHash,
  getFhirValidatorErrors,
  getPayload,
  handleResponse,
  identifyMessageType
} from "./util"
import * as fhir from "../models/fhir"
import * as bundleValidator from "../services/validation/bundle-validator"
import {userHasValidAuth} from "../services/validation/auth-level"
import {unauthorisedActionIssue} from "../models/errors/validation-errors"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$process-message`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const hopefullyBundle = getPayload(request) as fhir.Bundle
      if (identifyMessageType(hopefullyBundle) !== fhir.EventCodingCode.DISPENSE) {
        if (!userHasValidAuth(request, "user")) {
          return responseToolkit.response(unauthorisedActionIssue).code(403).type(CONTENT_TYPE_FHIR)
        }
      }

      const fhirValidatorResponse = await getFhirValidatorErrors(request)
      if (fhirValidatorResponse) {
        return responseToolkit.response(fhirValidatorResponse).code(400).type(CONTENT_TYPE_FHIR)
      }

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
  } as Hapi.ServerRoute
]
