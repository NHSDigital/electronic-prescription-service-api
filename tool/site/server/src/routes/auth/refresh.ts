import Hapi from "@hapi/hapi"
import {refreshToken} from "../../oauthUtils"
import {getSessionValue, setSessionValue} from "../../services/session"
import {getUtcEpochSeconds} from "../util"

export default {
  method: "POST",
  path: "/auth/refresh",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const oauthData = getSessionValue("oauth_data", request)
    const token = await refreshToken(oauthData)
    setSessionValue("oauth_data", token.data, request)
    setSessionValue("access_token", token.accessToken, request)
    return h.response({success: true, lastTokenFetched: getUtcEpochSeconds()}).code(200)
  }
}
