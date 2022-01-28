import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "GET",
  path: "/logout",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    setSessionValue(`access_token`, undefined, request)
    setSessionValue(`auth_level`, undefined, request)
    setSessionValue(`auth_method`, undefined, request)

    const baseUrl = process.env.BASE_PATH
      ? `/${process.env.BASE_PATH}/`
      : "/"

    return h.redirect(baseUrl)
  }
}
