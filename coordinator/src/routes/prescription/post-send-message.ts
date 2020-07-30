import {validatingHandler} from "../../services/handler";
import * as translator from "../../services/translation/translation-service";
import {Bundle} from "../../model/fhir-resources";
import {sendData} from "../../services/spine-communication";
import Hapi from "@hapi/hapi";
import * as common from "../../services/translation/common"

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
                const translatedMessage = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(requestPayload)
                const spineResponse = await sendData(translatedMessage)
                return responseToolkit.response(common.wrapInOperationOutcome(spineResponse)).code(spineResponse.statusCode)
            }
        )
    }
]
