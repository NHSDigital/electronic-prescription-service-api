import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default [
  {
    method: "POST",
    path: "/login",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const loginInfo = request.payload as any
      const auth_method = loginInfo.auth_method
      const access_token = loginInfo.access_token
      setSessionValue(`auth_method`, auth_method, request)
      setSessionValue(`access_token`, access_token, request)
      return h.response({}).code(200)
    }
  }
]
