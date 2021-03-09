import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication/spine-client"
import Hapi from "@hapi/hapi"
import {basePath, createHash, getFhirValidatorErrors, getPayload, handleResponse} from "../util"
import {getMessageHeader} from "../../services/translation/common/getResourcesOfType"
import * as fhir from "../../models/fhir"
import {CONTENT_TYPE_FHIR} from "../../app"
import * as bundleValidator from "../../services/validation/bundle-validator"

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
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const fhirValidatorResponse = await getFhirValidatorErrors(request)
      if (fhirValidatorResponse) {
        return responseToolkit.response(fhirValidatorResponse).code(400).type(CONTENT_TYPE_FHIR)
      }

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
