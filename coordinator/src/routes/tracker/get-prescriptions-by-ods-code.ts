import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes
} from "../util"

export default [
  /*
      Get FHIR prescriptions for an ODS Code
    */
  {
    method: "GET",
    path: `${BASE_PATH}/Tracker/prescriptions/{odsCode}`,
    handler:
      (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
        return responseToolkit
          .response(`Got a request for Prescription: ${request.params.shortFormId}`)
          .code(200)
          .type(ContentTypes.PLAIN_TEXT)
      }
  }
]
