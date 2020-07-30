import {validatingHandler} from "../../services/handler"
import * as translator from "../../services/translation/translation-service"
import {Bundle} from "../../model/fhir-resources"
import {isSandbox, isDirect, isPollable, defaultRequestHandler} from "../../services/spine-communication"
import Hapi from "@hapi/hapi"

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
                const spineResponse = await defaultRequestHandler.sendData(translatedMessage)

                if (isSandbox(spineResponse)) {
                    return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode)
                }

                if (isDirect(spineResponse)) {
                    return responseToolkit.response(spineResponse.body).code(spineResponse.statusCode).header('Content-Type', 'multipart/mixed; boundary=----=_MIME-Boundary')
                }

                if (isPollable(spineResponse)) {
                    return responseToolkit.response().code(spineResponse.statusCode).header('Content-Location', spineResponse.pollingUrl)
                }
            }
        )
    }
]
