import Hapi, {Request, RouteDefMethods} from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URLSearchParams} from "url"
import {createCombinedAuthSession, createSandboxAuthSession, createSeparateAuthSession} from "../../services/session"
import {
  getPrBranchUrl,
  parseOAuthState,
  prRedirectEnabled,
  prRedirectRequired
} from "../helpers"
import {
  exchangeCIS2IdTokenForApigeeAccessToken,
  getApigeeAccessTokenFromAuthCode,
  getCIS2TokenFromAuthCode,
  getSelectedRoleFromTokenResponse,
  getUserInfoRbacRoleFromCIS2Token
} from "../../oauthUtils"

export default {
  method: "GET" as RouteDefMethods,
  path: "/callback",
  options: {
    auth: false
  },
  handler: async (request: Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    // Local
    if (CONFIG.environment.endsWith("sandbox")) {
      createSandboxAuthSession(request, h)
      return h.redirect(CONFIG.baseUrl)
    }

    // Deployed Versions
    const state = parseOAuthState(request.query.state as string, request.logger)

    if (prRedirectRequired(state.prNumber)) {
      if (prRedirectEnabled()) {
        const queryString = new URLSearchParams(request.query).toString()
        return h.redirect(getPrBranchUrl(state.prNumber, "callback", queryString))
      } else {
        return h.response({}).code(400)
      }
    }

    if (isSeparateAuthLogin(request)) {
      try {
        const cis2Token = await getCIS2TokenFromAuthCode(request)

        const apigeeAccessToken = await exchangeCIS2IdTokenForApigeeAccessToken(cis2Token.id_token)

        const getTokenRole = () => {
          const role = getSelectedRoleFromTokenResponse(apigeeAccessToken)
          request.logger.info(`Apigee token role: ${role ?? "undefined"}`)
          return role
        }

        const getUserInfoRole = async () => {
          request.logger.info("Fetching userinfo to get RBAC role")
          const role = await getUserInfoRbacRoleFromCIS2Token(request, cis2Token)
          request.logger.info(`CIS2 userinfo role: ${role ?? "undefined"}`)
          return role
        }

        // Smartcard authentication will have a selected role,
        //  for non-smartcard authentication get a role from CIS2 userinfo endpoint
        let selectedRole = getTokenRole() ?? await getUserInfoRole()

        createSeparateAuthSession(apigeeAccessToken, request, h, selectedRole)

        return h.redirect(CONFIG.baseUrl)
      } catch (e) {
        request.logger.error(`Callback failed: ${e}`)
        return h.response({error: e})
      }
    }

    try {
      const tokenResponse = await getApigeeAccessTokenFromAuthCode(request, CONFIG.environment !== "int")

      createCombinedAuthSession(tokenResponse, request, h)

      return h.redirect(CONFIG.baseUrl)
    } catch (e) {
      return h.response({error: e})
    }
  }
}

function isSeparateAuthLogin(request: Hapi.Request) {
  const queryString = new URLSearchParams(request.query)
  return queryString.has("client_id")
}
