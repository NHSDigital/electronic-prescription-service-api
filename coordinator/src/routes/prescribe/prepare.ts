import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {
  BASE_PATH, ContentTypes, createHash,
  externalValidator, getPayload
} from "../util"
import {fhir} from "@models"
import * as bundleValidator from "../../services/validation/bundle-validator"
import {getScope} from "../../utils/headers"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$prepare`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const bundle = getPayload(request) as fhir.Bundle
        const scope = getScope(request.headers)
        const issues = bundleValidator.verifyBundle(bundle, scope)
        if (issues.length) {
          return responseToolkit.response(fhir.createOperationOutcome(issues)).code(400).type(ContentTypes.FHIR)
        }

        request.logger.info("Encoding HL7V3 signature fragments")
        const response = translator.convertFhirMessageToSignedInfoMessage(bundle, request.logger)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(bundle))})
        request.log("audit", {"PrepareEndpointResponse": response})
        return responseToolkit.response(response).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]
