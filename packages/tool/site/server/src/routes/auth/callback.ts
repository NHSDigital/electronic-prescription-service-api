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
  getSelectedRoleFromCis2IdToken,
  getUserIDFromCis2IdToken,
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
        const redirectUrl = getPrBranchUrl(state.prNumber, "callback", queryString)

        request.logger.info(`Redirecting to PR branch URL: ${redirectUrl}`)
        return h.redirect(redirectUrl)
      } else {
        request.logger.info("PR redirect disabled, but PR redirect required")
        return h.response({}).code(400)
      }
    }

    if (isSeparateAuthLogin(request)) {
      try {
        const cis2Token = await getCIS2TokenFromAuthCode(request)

        const apigeeAccessToken = await exchangeCIS2IdTokenForApigeeAccessToken(request, cis2Token.id_token)

        const getTokenRole = () => {
          const role = getSelectedRoleFromCis2IdToken(cis2Token)
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
        const selectedRole = getTokenRole() ?? await getUserInfoRole()

        const getCis2Uid = () => {
          const uid = getUserIDFromCis2IdToken(cis2Token)
          request.logger.info(`CIS2 id_token uid: ${uid ?? "undefined"}`)
          return uid
        }

        const getFallbackUid = () => {
          const uid = process.env.APP_JWT_SUBJECT ?? ""
          request.logger.info(`Using fallback UID from environment variable: ${uid ?? "undefined"}`)
          return uid
        }

        // Extract UID from CIS2 id_token or use fallback UID from environment variable
        const uid = getCis2Uid() ?? getFallbackUid()

        request.logger.info(`Using selected role: ${selectedRole} for separate auth session`)
        createSeparateAuthSession(apigeeAccessToken, request, h, selectedRole, uid)

        request.logger.info(`Redirecting to base URL: ${CONFIG.baseUrl}`)
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
