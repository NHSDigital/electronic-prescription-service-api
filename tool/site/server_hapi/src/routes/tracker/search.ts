import Hapi from "@hapi/hapi"
import {getEpsClient} from "../../services/communication/eps-client"
import {getSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/search",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const response = await epsClient.makeGetTrackerRequest(request.query)
      return h.response(response).code(200)
    }
  }
]
