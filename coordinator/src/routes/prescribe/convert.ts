import * as translator from "../../services/translation/request"
import Hapi from "@hapi/hapi"
import {basePath, validatingHandler} from "../util"
import * as fhir from "../../models/fhir"

const CONTENT_TYPE_XML = "application/xml"
const CONTENT_TYPE_PLAIN_TEXT = "text/plain"

export default [
  /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
  {
    method: "POST",
    path: `${basePath}/$convert`,
    handler: validatingHandler(
      (requestPayload: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const isSmokeTest = request.headers["x-smoke-test"]
        const contentType = isSmokeTest ? CONTENT_TYPE_PLAIN_TEXT : CONTENT_TYPE_XML
        request.logger.info("Building HL7V3 message")
        const response = translator.convertFhirMessageToSpineRequest(requestPayload).message
        return responseToolkit.response(response).code(200).header("Content-Type", contentType)
      }
    )
  } as Hapi.ServerRoute
]
