import * as translator from "../../services/translation"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../models/fhir/fhir-resources"
import {validatingHandler} from "../util"

const CONTENT_TYPE_XML = "application/xml"
const CONTENT_TYPE_PLAIN_TEXT = "text/plain"

export default [
  /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
  {
    method: "POST",
    path: "/$convert",
    handler: validatingHandler(
      false,
      (requestPayload: Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const isSmokeTest = request.headers["x-smoke-test"]
        const contentType = isSmokeTest ? CONTENT_TYPE_PLAIN_TEXT : CONTENT_TYPE_XML
        const response = translator.convertFhirMessageToSpineRequest(requestPayload).message
        return responseToolkit.response(response).code(200).header("Content-Type", contentType)
      }
    )
  },
  {
    method: "POST",
    path: "/$convert-processed",
    handler: validatingHandler(
      false,
      (requestPayload: Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const isSmokeTest = request.headers["x-smoke-test"]
        const contentType = isSmokeTest ? CONTENT_TYPE_PLAIN_TEXT : CONTENT_TYPE_XML
        const response = translator.convertFhirMessageToCanonicalisedXml(requestPayload)
        return responseToolkit.response(response).code(200).header("Content-Type", contentType)
      }
    )
  }
]
