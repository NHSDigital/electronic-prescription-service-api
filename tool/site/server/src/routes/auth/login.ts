import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "POST",
  path: "/login",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const authMethod = (request.payload as any).authMethod
    setSessionValue(`auth_level`, "user", request)
    setSessionValue(`auth_method`, authMethod, request)
    h.state('Access-Token-Set', "true", {isHttpOnly: false})
    return h.response({redirectUri: "/callback"}).code(200)
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
