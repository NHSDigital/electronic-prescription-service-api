import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  CONTENT_TYPE_FHIR,
  createHash,
  externalValidator,
  getPayload,
  userAuthValidator
} from "../util"
import * as fhir from "../../models/fhir"
import * as bundleValidator from "../../services/validation/bundle-validator"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$prepare`,
    handler: userAuthValidator(externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
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
    ))
  } as Hapi.ServerRoute
]
