import * as translator from "../../services/translation"
import {Bundle} from "../../models/fhir/fhir-resources"
import Hapi from "@hapi/hapi"
import {createHash, validatingHandler} from "../util"

const CONTENT_TYPE_FHIR = "application/fhir+json; fhirVersion=4.0"
const CONTENT_TYPE_JSON = "application/json"

export default [
  /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
  {
    method: "POST",
    path: "/$prepare",
    handler: validatingHandler(
      (requestPayload: Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const isSmokeTest = request.headers["x-smoke-test"]
        const contentType = isSmokeTest ? CONTENT_TYPE_JSON : CONTENT_TYPE_FHIR
        request.logger.info("Encoding HL7V3 signature fragments")
        const response = translator.convertFhirMessageToSignedInfoMessage(requestPayload)
        request.logger.info("audit", createHash(JSON.stringify(requestPayload)))
        request.logger.info("audit", response)
        return responseToolkit.response(response).code(200).header("Content-Type", contentType)
      }
    )
  } as Hapi.ServerRoute
]
