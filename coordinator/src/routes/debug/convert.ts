import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH, CONTENT_TYPE_FHIR, CONTENT_TYPE_XML,
  getFhirValidatorErrors, getPayload, isBundle, isParameters, isTask
} from "../util"
import * as fhir from "../../models/fhir"
import * as bundleValidator from "../../services/validation/bundle-validator"
import * as parametersValidator from "../../services/validation/parameters-validator"
import * as taskValidator from "../../services/validation/task-validator"

export default [
  /*
    Convert a FHIR message into an HL7 V3 message.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$convert`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const fhirValidatorResponse = await getFhirValidatorErrors(request)
      if (fhirValidatorResponse) {
        return responseToolkit.response(fhirValidatorResponse).code(400).type(CONTENT_TYPE_FHIR)
      }

      const payload = getPayload(request) as fhir.Resource
      const requestId = request.headers["nhsd-request-id"].toUpperCase()
      if (isBundle(payload)) {
        const issues = bundleValidator.verifyBundle(payload)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building HL7V3 message from Bundle")
        const spineRequest = translator.convertBundleToSpineRequest(payload, requestId)
        return responseToolkit.response(spineRequest.message).code(200).type(CONTENT_TYPE_XML)
      }

      if (isParameters(payload)) {
        const issues = parametersValidator.verifyParameters(payload)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building HL7V3 message from Parameters")
        const spineRequest = await translator.convertParametersToSpineRequest(payload, requestId, request.logger)
        return responseToolkit.response(spineRequest.message).code(200).type(CONTENT_TYPE_XML)
      }

      if (isTask(payload)) {
        const issues = taskValidator.verifyTask(payload)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(CONTENT_TYPE_FHIR)
        }

        request.logger.info("Building HL7V3 message from Task")
        const spineRequest = await translator.convertTaskToSpineRequest(payload, requestId, request.logger)
        return responseToolkit.response(spineRequest.message).code(200).type(CONTENT_TYPE_XML)
      }

      return responseToolkit.response(unsupportedResponse).code(400).type(CONTENT_TYPE_FHIR)
    }
  }
]

const unsupportedResponse: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [{
    severity: "fatal",
    code: "invalid",
    diagnostics: "Message not supported by $convert endpoint"
  }]
}
