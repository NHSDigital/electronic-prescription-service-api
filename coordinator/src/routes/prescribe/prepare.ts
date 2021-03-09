import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {basePath, createHash, validatingHandler} from "../util"
import * as fhir from "../../models/fhir"
import {CONTENT_TYPE_FHIR} from "../../app"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: `${basePath}/$prepare`,
    handler: validatingHandler(
      (requestPayload: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Encoding HL7V3 signature fragments")
        const response = translator.convertFhirMessageToSignedInfoMessage(requestPayload)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(requestPayload))})
        request.log("audit", {"PrepareEndpointResponse": response})
        return responseToolkit.response(response).code(200).type(CONTENT_TYPE_FHIR)
      }
    )
  } as Hapi.ServerRoute
]
