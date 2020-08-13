import * as translator from "../../services/translation/translation-service"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../model/fhir-resources"
import {validatingHandler} from "../util"

const CONTENT_TYPE = "application/xml"

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
        const response = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(requestPayload)
        return responseToolkit.response(response).code(200).header("Content-Type", CONTENT_TYPE)
      }
    )
  }
]
