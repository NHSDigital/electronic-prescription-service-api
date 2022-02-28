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
    if (lastTokenRefresh && lastTokenRefresh <= ((Date.now() / 1000) + parseInt(getSessionValue("token_expires_in", request)) - 10)) {
      return h.response({lastTokenRefresh}).code(200)
    }

    const oauthData = getSessionValue("oauth_data", request)
    const token = await refreshToken(oauthData)
    if (token.expired()) {
      return h.response({redirectUri: `${CONFIG.baseUrl}logout`}).code(400)
    }

    setSessionValue("oauth_data", token.data, request)
    setSessionValue("access_token", token.accessToken, request)
    const tokenRefreshTime = getUtcEpochSeconds().toString()
    setSessionValue("last_token_refresh", tokenRefreshTime, request)
    h.state("Last-Token-Refresh", tokenRefreshTime, {isHttpOnly: false})

    return h.response({lastTokenRefresh: tokenRefreshTime}).code(200)
  }
}
