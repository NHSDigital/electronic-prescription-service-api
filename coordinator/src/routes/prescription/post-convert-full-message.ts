import {validatingHandler} from "../../services/handler";
import * as translator from "../../services/translation/translation-service";
import Hapi from "@hapi/hapi";
import {Bundle} from "../../model/fhir-resources";

export default [
    /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
    {
        method: 'POST',
        path: '/Convert',
        handler: validatingHandler(
            false,
            (requestPayload: Bundle, responseToolkit: Hapi.ResponseToolkit) => {
                const response = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(requestPayload)
                return responseToolkit.response(response).code(200)
            }
        )
    }
]
