import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes
} from "../util"

export default [
  /*
      Get a FHIR prescription by shortFormId
    */
  {
    method: "GET",
    path: `${BASE_PATH}/Tracker/prescription/{shortFormId}`,
    handler:
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        return responseToolkit.response(`Got a request for Prescription: ${request.params.shortFormId}`).code(200).type(ContentTypes.PLAIN_TEXT)
      }
  }
]