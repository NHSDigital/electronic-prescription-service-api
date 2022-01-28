import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"
import {getRegisteredCallbackUrl} from "../helpers"

interface LoginInfo {
  accessToken: string
  authLevel: "user" | "system"
  authMethod: string
}

export default {
  method: "POST",
  path: "/login",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const loginInfo = request.payload as LoginInfo

    setSessionValue(`access_token`, loginInfo.accessToken, request)
    setSessionValue(`auth_level`, loginInfo.authLevel, request)
    setSessionValue(`auth_method`, loginInfo.authMethod, request)

    const redirectUri = process.env.ENVIRONMENT?.endsWith("sandbox")
      ? "/callback"
      : loginInfo.authLevel === "system"
        ? "/"
        : getRegisteredCallbackUrl("callback")

    return h.response({redirectUri}).code(200)
  }
}

// @app.route("/login", methods=["POST"])
// @exclude_from_auth()
// def post_login():
//     login_request = flask.request.json
//     auth_method = login_request["authMethod"]
//     if config.ENVIRONMENT.endswith("-sandbox"):
//         authorize_url = "/callback"
//     else:
//         state = create_oauth_state(get_pr_number(config.BASE_PATH), "home")
//         authorize_url = get_authorize_url(state, auth_method)
//     response = app.make_response({"redirectUri": authorize_url})
//     set_auth_method_cookie(response, auth_method)
//     set_auth_level_cookie(response, "user")
//     return response
