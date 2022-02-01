import Hapi from "@hapi/hapi"
import {URL} from "url"
import createOAuthClient from "../../oauthUtils"
import {setSessionValue} from "../../services/session"
import {getPrBranchUrl, getRegisteredCallbackUrl, parseOAuthState, prRedirectEnabled, prRedirectRequired} from "../helpers"

export default {
  method: "GET",
  path: "/callback",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

    // Local
    if (process.env.ENVIRONMENT?.endsWith("sandbox")) {
      request.cookieAuth.set({})
      h.state("Last-Token-Fetched", Math.round(new Date().getTime() / 1000).toString(), {isHttpOnly: false})
      h.state("Access-Token-Set", "true", {isHttpOnly: false})
      return h.redirect("/")
    }

    // Deployed Versions
    const state = parseOAuthState(request.query.state as string, request.logger)

    if (prRedirectRequired(state.prNumber)) {
      if (prRedirectEnabled()) {
        return h.redirect(getPrBranchUrl(state.prNumber, "callback", request.query))
      } else {
        return h.response({}).code(400)
      }
    }

    const callbackUrl = new URL(`${getRegisteredCallbackUrl("callback")}?${getQueryString(request.query)}`)

    const oauthClient = createOAuthClient()
    const tokenResponse = await oauthClient.getToken(callbackUrl)

    setSessionValue(`access_token`, tokenResponse.accessToken, request)

    request.cookieAuth.set({})
    h.state("Last-Token-Fetched", Math.round(new Date().getTime() / 1000).toString(), {isHttpOnly: false})
    h.state("Access-Token-Set", "true", {isHttpOnly: false})

    return h.redirect(`/${process.env.BASE_PATH}/`)
  }
}

function getQueryString(query: Hapi.RequestQuery) {
  return Object.keys(query).map(key => `${key}=${query[key]}`).join("&")
}
