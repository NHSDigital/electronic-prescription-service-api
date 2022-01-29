import Hapi from "@hapi/hapi"
import createOAuthClient from "../../oauthUtils"
import {setSessionValue} from "../../services/session"
import {createOAuthState} from "../helpers"

interface LoginInfo {
  accessToken: string
  authLevel: "user" | "system"
  authMethod: string
}

export default {
  method: "POST",
  path: "/login",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

    const loginInfo = request.payload as LoginInfo

    setSessionValue(`auth_level`, loginInfo.authLevel, request)
    setSessionValue(`auth_method`, loginInfo.authMethod, request)

    if (process.env.ENVIRONMENT?.endsWith("sandbox")) {
      // Local
      return h.response({redirectUri: "/callback"}).code(200)
    }

    if (loginInfo.authLevel === "system") {
      // todo (unattended auth)
      return h.response({redirectUri: `${process.env.BASE_PATH}callback`}).code(200)
    }

    const oauthClient = createOAuthClient()

    const redirectUri = oauthClient.getUri({
      state: createOAuthState()
    })

    return h.response({redirectUri})
  }
}
