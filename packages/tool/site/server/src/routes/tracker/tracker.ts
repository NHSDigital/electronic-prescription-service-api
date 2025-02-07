import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession} from "../../services/session"
import {getCorrelationId} from "../util"

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/taskTracker",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const response = await epsClient.makeGetTaskTrackerRequest(request.query, correlationId)
      return h.response(response).code(200)
    }
  }
]
