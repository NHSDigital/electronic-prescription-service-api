import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {clearSessionValue} from "../../services/session"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/prescribe/reset",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      clearSessionValue("prescription_ids", request)
      clearSessionValue("prescription_id", request)
      return responseToolkit.response({}).code(200)
    }
  }
]
