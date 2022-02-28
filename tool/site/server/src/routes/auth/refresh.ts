import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {refreshToken} from "../../oauthUtils"
import {getSessionValue, setSessionValue} from "../../services/session"
import {getUtcEpochSeconds} from "../util"

export default {
  method: "POST",
  path: "/auth/refresh",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const lastTokenRefresh = getSessionValue("last_token_refresh", request)
    let nextRefreshTime = getSessionValue("next_refresh_time", request)

    if (lastTokenRefresh <= nextRefreshTime) {
      return h.response({nextRefreshTime}).code(200)
    }

    const oauthData = getSessionValue("oauth_data", request)
    const token = await refreshToken(oauthData)
    if (token.expired()) {
      return h.response({redirectUri: `${CONFIG.baseUrl}logout`}).code(400)
    }

    const tokenRefreshTime = getUtcEpochSeconds()
    const timeTillRefresh = 599
    nextRefreshTime = tokenRefreshTime + timeTillRefresh - 10
    setSessionValue("oauth_data", token.data, request)
    setSessionValue("access_token", token.accessToken, request)
    setSessionValue("last_token_refresh", tokenRefreshTime, request)
    setSessionValue("next_refresh_time", nextRefreshTime, request)

    return h.response({nextRefreshTime}).code(200)
  }
}
