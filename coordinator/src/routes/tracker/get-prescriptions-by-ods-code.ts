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
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        return responseToolkit.response(`Got a request for ODS Code: ${request.params.odsCode}`).code(200).type(ContentTypes.PLAIN_TEXT)
      }
  }
]