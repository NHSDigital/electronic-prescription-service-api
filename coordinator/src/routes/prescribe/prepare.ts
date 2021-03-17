import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {BASE_PATH, CONTENT_TYPE_FHIR, createHash, getFhirValidatorErrors, getPayload} from "../util"
import * as fhir from "../../models/fhir"
import * as bundleValidator from "../../services/validation/bundle-validator"
import {userHasValidAuth} from "../../services/validation/auth-level"
import {unauthorisedActionIssue} from "../../models/errors/validation-errors"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$prepare`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      if (!userHasValidAuth(request, "user")) {
        return responseToolkit.response(unauthorisedActionIssue).code(403).type(CONTENT_TYPE_FHIR)
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

      request.logger.info("Encoding HL7V3 signature fragments")
      const response = translator.convertFhirMessageToSignedInfoMessage(bundle)
      request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
      request.log("audit", {"PrepareEndpointResponse": response})
      return responseToolkit.response(response).code(200).type(CONTENT_TYPE_FHIR)
    }
  } as Hapi.ServerRoute
]
