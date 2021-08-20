import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir} from "@models"
import * as bundleValidator from "../../services/validation/bundle-validator"
import * as parametersValidator from "../../services/validation/parameters-validator"
import * as taskValidator from "../../services/validation/task-validator"
import {isBundle, isParameters, isTask} from "../../utils/type-guards"
import {getScope} from "../../utils/headers"
import {getStatusCode} from "../../utils/status-code"

export default [
  /*
    Convert a FHIR message into an HL7 V3 message.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$convert`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const payload = getPayload(request) as fhir.Resource
        const scope = getScope(request.headers)
        if (isBundle(payload)) {
          const issues = bundleValidator.verifyBundle(payload, scope)
          if (issues.length) {
            const response = fhir.createOperationOutcome(issues)
            const statusCode = getStatusCode(issues)
            return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
          }

          request.logger.info("Building HL7V3 message from Bundle")
          const spineRequest = await translator.convertBundleToSpineRequest(payload, request.headers, request.logger)
          return responseToolkit.response(spineRequest.message).code(200).type(ContentTypes.XML)
        }

        if (isParameters(payload)) {
          const issues = parametersValidator.verifyParameters(payload, scope)
          if (issues.length) {
            const response = fhir.createOperationOutcome(issues)
            const statusCode = getStatusCode(issues)
            return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
          }

          request.logger.info("Building HL7V3 message from Parameters")
          const spineRequest = await translator.convertParametersToSpineRequest(
            payload,
            request.headers,
            request.logger
          )
          return responseToolkit.response(spineRequest.message).code(200).type(ContentTypes.XML)
        }

        if (isTask(payload)) {
          const issues = taskValidator.verifyTask(payload, scope)
          if (issues.length) {
            const response = fhir.createOperationOutcome(issues)
            const statusCode = getStatusCode(issues)
            return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
          }

          request.logger.info("Building HL7V3 message from Task")
          const spineRequest = await translator.convertTaskToSpineRequest(payload, request.headers, request.logger)
          return responseToolkit.response(spineRequest.message).code(200).type(ContentTypes.XML)
        }

        return responseToolkit.response(unsupportedResponse).code(400).type(ContentTypes.FHIR)
      }
    )
  }
]

const unsupportedResponse: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [{
    severity: "fatal",
    code: fhir.IssueCodes.INVALID,
    diagnostics: "Message not supported by $convert endpoint"
  }]
}
