import * as translator from "../../services/translation/translation-service"
import {Bundle} from "../../model/fhir-resources"
import {defaultRequestHandler} from "../../services/spine-communication"
import Hapi from "@hapi/hapi"
import {handlePollableResponse, validatingHandler} from "../util"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: "/$process-message",
    handler: validatingHandler(
      false,
      async (requestPayload: Bundle, responseToolkit: Hapi.ResponseToolkit) => {
        const translatedMessage = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(requestPayload)
        const spineResponse = await defaultRequestHandler.sendData(translatedMessage)
        return handlePollableResponse(spineResponse, responseToolkit)
      }
    )
  }
]
