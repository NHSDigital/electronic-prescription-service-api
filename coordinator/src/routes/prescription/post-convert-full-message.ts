import * as translator from "../../services/translation/translation-service"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../model/fhir-resources"
import {validatingHandler} from "../util"
import * as requestBuilder from "../../services/request-builder"

const CONTENT_TYPE = "application/fhir+json; fhirVersion=4.0"

export default [
  /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
  {
    method: "POST",
    path: "/$convert",
    handler: validatingHandler(
      false,
      (requestPayload: Bundle, responseToolkit: Hapi.ResponseToolkit) => {
        const spineRequest = translator.convertFhirMessageToSpineRequest(requestPayload)
        const response = requestBuilder.toParameters(spineRequest)
        return responseToolkit.response(response).code(200).header("Content-Type", CONTENT_TYPE)
      }
    )
  }
]
