import Hapi from "@hapi/hapi"
import {
  BASE_PATH
} from "../util"
import {getOdsClient} from "../../services/communication/ods-client"

export default [
  /*
    Test ODS retrieval
  */
  {
    method: "GET",
    path: `${BASE_PATH}/test_ods`,
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const client = getOdsClient(true)
      const response = await client.lookupOrganization("FTX40", request.logger)

      return response == null ?
        responseToolkit.response("An error occurred").code(500).type("text/plain") :
        responseToolkit.response(response).code(200).type("text/plain")
    }
  }
]
