import {validatingHandler} from "../../services/handler";
import * as translator from "../../services/translation-service";
import {Bundle} from "../../services/fhir-resources";
import {sendData} from "../../services/spine-communication";
import Hapi from "@hapi/hapi";

export default [
    /*
      Send a signed message on to SPINE.
    */
    {
        method: 'POST',
        path: '/Send',
        handler: validatingHandler(
            false,
            async (requestPayload: Bundle, responseToolkit: Hapi.ResponseToolkit) => {
                const translatedMessage = translator.convertFhirMessageToHl7V3ParentPrescription(requestPayload)
                const spineResponse = await sendData(translatedMessage)
                return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode)
            }
        )
    }
]
