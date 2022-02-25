import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"

export default {
  method: "GET",
  path: "/logout",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    h.state("Access-Token-Set", "", {ttl: 0})
    h.state("Access-Token-Fetched", "", {ttl: 0})
    request.yar.reset()
    request.cookieAuth.clear()
    return h.view("index", {baseUrl: CONFIG.baseUrl, environment: CONFIG.environment})
  }
}
