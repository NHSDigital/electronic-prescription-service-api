import Hapi from "@hapi/hapi"

export default {
  method: "GET",
  path: "/callback",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    return h.redirect("/")
  }
}

// @app.route("/callback", methods=["GET"])
// @exclude_from_auth()
// def get_callback():
//     # local development
//     if config.ENVIRONMENT.endswith("-sandbox"):
//         hapi_session_cookie, _ = hapi_passthrough.post_set_session("", "", "")
//         session_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600))
//         redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
//         response = flask.redirect(redirect_url)
//         set_session_cookie(response, hapi_session_cookie, session_expiry)
//         mock_access_token_encrypted = fernet.encrypt("mock_access_token".encode("utf-8")).decode("utf-8")
//         set_access_token_cookies(response, mock_access_token_encrypted, session_expiry)
//         return response


// # deployed environments
//     state = parse_oauth_state(flask.request.args.get("state"))
//     if pr_redirect_required(config.BASE_PATH, state):
//         if pr_redirect_enabled(config.ENVIRONMENT):
//             return flask.redirect(
//                 get_pr_branch_url(state["prNumber"], "callback", flask.request.query_string.decode("utf-8")))
//         else:
//             return app.make_response("Bad Request", 400)

//     code = flask.request.args.get("code")
//     auth_level = get_auth_level_from_cookie()
//     auth_method = get_auth_method_from_cookie()
//     token_response_json = exchange_code_for_token(code, auth_method)
//     access_token = token_response_json["access_token"]
//     access_token_expires_in = token_response_json["expires_in"]
//     access_token_encrypted = fernet.encrypt(access_token.encode("utf-8")).decode("utf-8")
//     access_token_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(access_token_expires_in))
//     hapi_session_cookie, _ = hapi_passthrough.post_set_session(access_token, auth_level, auth_method)
//     redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
//     response = flask.redirect(redirect_url)
//     set_session_cookie(response, hapi_session_cookie, access_token_expires)
//     set_access_token_cookies(response, access_token_encrypted, access_token_expires)
//     return response