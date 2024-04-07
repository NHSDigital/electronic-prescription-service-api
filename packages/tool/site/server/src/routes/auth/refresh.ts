import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {CONFIG} from "../../config"
import {refreshToken} from "../../oauthUtils"
import {getSessionValue, setSessionValue} from "../../services/session"
import {getUtcEpochSeconds} from "../util"

export default {
  method: "POST" as RouteDefMethods,
  path: "/auth/refresh",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const oauthData = getSessionValue("oauth_data", request)
    const token = await refreshToken(oauthData)
    if (token.expired()) {
      return h.response({redirectUri: `${CONFIG.baseUrl}logout`}).code(440)
    }
    const tokenRefreshTime = getUtcEpochSeconds()
    const timeTillRefresh = 599
    const nextRefreshTime = tokenRefreshTime + timeTillRefresh - 10
    setSessionValue("access_token", token.accessToken, request)
    setSessionValue("next_refresh_time", nextRefreshTime, request)
    return h.response({nextRefreshTime}).code(200)
  }
}
