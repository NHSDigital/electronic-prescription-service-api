import Hapi from "@hapi/hapi"
import {clearSession} from "../../services/session"
import {CONFIG} from "../../config"

export default {
  method: "GET",
  path: "/logout",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    clearSession(request, h)
    return h.view("index", {baseUrl: CONFIG.baseUrl, environment: CONFIG.environment})
  }
}
