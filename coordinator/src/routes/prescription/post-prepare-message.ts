import {validatingHandler} from "../../services/handler";
import * as translator from "../../services/translation-service";
import {Bundle} from "../../services/fhir-resources";
import Hapi from "@hapi/hapi";

export default [
    /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
    {
        method: 'POST',
        path: '/Prepare',
        handler: validatingHandler(
            false,
            (requestPayload: Bundle, responseToolkit: Hapi.ResponseToolkit) => {
                const response = translator.convertFhirMessageToHl7V3SignedInfo(requestPayload)
                return responseToolkit.response(response).code(200)
            }
        )
    }
]
