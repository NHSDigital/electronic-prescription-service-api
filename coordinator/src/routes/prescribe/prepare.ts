import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {basePath, createHash, bundleValidation} from "../util"
import * as fhir from "../../models/fhir"

const CONTENT_TYPE_FHIR = "application/fhir+json; fhirVersion=4.0"
const CONTENT_TYPE_JSON = "application/json"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: `${basePath}/$prepare`,
    handler: bundleValidation(
      (requestPayload: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const isSmokeTest = request.headers["x-smoke-test"]
        const contentType = isSmokeTest ? CONTENT_TYPE_JSON : CONTENT_TYPE_FHIR
        request.logger.info("Encoding HL7V3 signature fragments")
        const response = translator.convertFhirMessageToSignedInfoMessage(requestPayload)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(requestPayload))})
        request.log("audit", {"PrepareEndpointResponse": response})
        return responseToolkit.response(response).code(200).header("Content-Type", contentType)
      }
    )
  } as Hapi.ServerRoute
]
