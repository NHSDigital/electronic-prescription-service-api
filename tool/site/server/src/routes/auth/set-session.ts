import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "POST",
  path: "/set-session",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const loginInfo = request.payload as any

    const accessToken = loginInfo.access_token
    setSessionValue(`access_token`, accessToken, request)

    const authLevel = loginInfo.auth_level
    setSessionValue(`auth_level`, authLevel, request)

    if (loginInfo.auth_method) {
      const authMethod = loginInfo.auth_method
      setSessionValue(`auth_method`, authMethod, request)
    }

    return h.response({}).code(200)
  }
}

