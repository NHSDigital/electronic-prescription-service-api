import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "GET",
  path: "/logout",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    h.state("Access-Token-Set", "", {ttl: 0})
    h.state("Last-Token-Fetched", "", {ttl: 0})
    request.cookieAuth.clear()

    setSessionValue(`access_token`, undefined, request)
    setSessionValue(`auth_level`, undefined, request)
    setSessionValue(`auth_method`, undefined, request)

    const baseUrl = process.env.BASE_PATH
      ? `/${process.env.BASE_PATH}/`
      : "/"

    return h.view("index", {baseUrl, environment: process.env.ENVIRONMENT})
  }
}
