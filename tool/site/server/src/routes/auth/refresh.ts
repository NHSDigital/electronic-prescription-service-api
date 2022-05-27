import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {refreshApigeeAccessToken, refreshTokenExpired} from "../../oauthUtils"
import {getApigeeRefreshTokenFromSession, refreshAuthSessionValues} from "../../services/session"

export default {
  method: "POST",
  path: "/auth/refresh",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const refreshToken = getApigeeRefreshTokenFromSession(request)
    const newAccessToken = await refreshApigeeAccessToken(refreshToken)
    if (refreshTokenExpired(newAccessToken)) {
      return h.response({redirectUri: `${CONFIG.baseUrl}logout`}).code(440)
    }
    const nextRefreshTime = refreshAuthSessionValues(newAccessToken, request)
    return h.response({nextRefreshTime}).code(200)
  }
}
