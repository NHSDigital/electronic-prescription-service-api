import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession} from "../../services/session"

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/taskTracker",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const response = await epsClient.makeGetTaskTrackerRequest(request.query)
      return h.response(response).code(200)
    }
  }
]
