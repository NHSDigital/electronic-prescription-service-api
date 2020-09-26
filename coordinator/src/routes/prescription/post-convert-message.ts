import * as translator from "../../services/translation"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../models/fhir/fhir-resources"
import {validatingHandler} from "../util"

const CONTENT_TYPE = "text/plain"

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
        const response = translator.convertFhirMessageToSpineRequest(requestPayload).message
        return responseToolkit.response(response).code(200).header("Content-Type", CONTENT_TYPE)
      }
    )
  }
]
