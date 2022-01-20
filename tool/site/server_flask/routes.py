import base64
import datetime
import io
import json
import zipfile
from functools import wraps
import flask
import urllib.parse
import config
from api import make_eps_api_metadata_request
from app import app, fernet
from auth import exchange_code_for_token, get_access_token, login, set_access_token_cookies, get_authorize_url
from client import render_rivets_client, render_react_client
from cookies import (
    set_previous_prescription_id_cookie,
    set_current_prescription_id_cookie,
    set_next_prescription_id_cookie,
    reset_previous_prescription_id_cookie,
    reset_next_prescription_id_cookie,
    get_auth_method_from_cookie,
    set_auth_method_cookie,
    get_auth_level_from_cookie,
    set_auth_level_cookie,
    set_session_cookie
)
from helpers import (
    pr_redirect_required,
    pr_redirect_enabled,
    get_pr_branch_url,
    parse_oauth_state,
    get_pr_number,
    create_oauth_state
)
import hapi_passthrough


def exclude_from_auth(*args, **kw):
    def wrapper(endpoint_method):
        endpoint_method._exclude_from_auth = False

        @wraps(endpoint_method)
        def wrapped(*endpoint_args, **endpoint_kw):
            return endpoint_method(*endpoint_args, **endpoint_kw)

        return wrapped

    return wrapper


@app.before_request
def auth_check():
    if config.STATIC_URL in flask.request.path:
        return

    flask.g.skip_auth = False

    if flask.request.endpoint in app.view_functions:
        view_func = app.view_functions[flask.request.endpoint]
        flask.g.skip_auth = hasattr(view_func, "_exclude_from_auth")

    if not flask.g.skip_auth:
        access_token_encrypted = flask.request.cookies.get("Access-Token")
        if access_token_encrypted is not None:
            try:
                access_token = fernet.decrypt(access_token_encrypted.encode("utf-8")).decode("utf-8")
            except:
                return login()
        else:
            return login()


@app.route("/change-auth", methods=["GET"])
@exclude_from_auth()
def get_change_auth():
    return render_react_client("change-auth")


@app.route("/change-auth", methods=["POST"])
@exclude_from_auth()
def post_change_auth():
    login_request = flask.request.json
    auth_method = login_request["authMethod"]
    if config.ENVIRONMENT.endswith("-sandbox"):
        authorize_url = "/callback"
    else:
        state = create_oauth_state(get_pr_number(config.BASE_PATH), "home")
        authorize_url = get_authorize_url(state, auth_method)
    response = app.make_response({"redirectUri": authorize_url})
    set_auth_method_cookie(response, auth_method)
    set_auth_level_cookie(response, "user")
    return response


@app.route("/unattended-login", methods=["POST"])
@exclude_from_auth()
def post_unattended_login():
    token_response_json = hapi_passthrough.get_unattended_access_token()
    access_token = token_response_json['access_token']
    access_token_expires_in = token_response_json['expires_in']

    hapi_session_cookie, _ = hapi_passthrough.post_set_session(access_token, "system")

    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
    response = app.make_response({"redirectUri": redirect_url})

    access_token_encrypted = fernet.encrypt(access_token.encode("utf-8")).decode("utf-8")
    access_token_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(access_token_expires_in))
    set_session_cookie(response, hapi_session_cookie, access_token_expires)
    set_access_token_cookies(response, access_token_encrypted, access_token_expires)
    set_auth_level_cookie(response, "system")
    return response


@app.route("/callback", methods=["GET"])
@exclude_from_auth()
def get_callback():
    # local development
    if config.ENVIRONMENT.endswith("-sandbox"):
        hapi_session_cookie, _ = hapi_passthrough.post_set_session("", "", "")
        session_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600))
        redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
        response = flask.redirect(redirect_url)
        set_session_cookie(response, hapi_session_cookie, session_expiry)
        mock_access_token_encrypted = fernet.encrypt("mock_access_token".encode("utf-8")).decode("utf-8")
        set_access_token_cookies(response, mock_access_token_encrypted, session_expiry)
        return response

    # deployed environments
    state = parse_oauth_state(flask.request.args.get("state"))
    if pr_redirect_required(config.BASE_PATH, state):
        if pr_redirect_enabled(config.ENVIRONMENT):
            return flask.redirect(
                get_pr_branch_url(state["prNumber"], "callback", flask.request.query_string.decode("utf-8")))
        else:
            return app.make_response("Bad Request", 400)

    code = flask.request.args.get("code")
    auth_level = get_auth_level_from_cookie()
    auth_method = get_auth_method_from_cookie()
    token_response_json = exchange_code_for_token(code, auth_method)
    access_token = token_response_json["access_token"]
    access_token_expires_in = token_response_json["expires_in"]
    access_token_encrypted = fernet.encrypt(access_token.encode("utf-8")).decode("utf-8")
    access_token_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(access_token_expires_in))
    hapi_session_cookie, _ = hapi_passthrough.post_set_session(access_token, auth_level, auth_method)
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
    response = flask.redirect(redirect_url)
    set_session_cookie(response, hapi_session_cookie, access_token_expires)
    set_access_token_cookies(response, access_token_encrypted, access_token_expires)
    return response


@app.route("/_healthcheck", methods=["GET"])
@exclude_from_auth()
def get_healthcheck():
    return hapi_passthrough.get_healthcheck()


@app.route("/_status", methods=["GET"])
@exclude_from_auth()
def get_status():
    return hapi_passthrough.get_status()


@app.route("/", methods=["GET"])
def get_home():
    return render_rivets_client("home")


@app.route("/search", methods=["GET"])
def get_search():
    return render_react_client("search")


@app.route("/prescribe/load", methods=["GET"])
def get_load():
    return render_rivets_client("load")


@app.route("/download", methods=['GET'])
def download():
    zFile = io.BytesIO()
    access_token = get_access_token()
    hapi_session = hapi_passthrough.get_hapi_session()
    short_prescription_ids = hapi_session["prescriptionIds"]
    with zipfile.ZipFile(zFile, 'w') as zip_file:
        for index, short_prescription_id in enumerate(short_prescription_ids):
            bundle = hapi_passthrough.get_prescription(short_prescription_id)
            zip_file.writestr(f"prepare_request_{index + 1}.json", json.dumps(bundle, indent=2))
            if access_token:
                xml, _status_code = make_eps_api_convert_message_request(access_token, bundle)
                zip_file.writestr(f"prepare_request_{index + 1}.xml", xml)
    zFile.seek(0)

    return flask.send_file(
        zFile,
        mimetype='application/zip',
        as_attachment=True,
        attachment_filename='messages.zip')


def update_pagination(response, short_prescription_ids, current_short_prescription_id):
    previous_short_prescription_id_index = short_prescription_ids.index(current_short_prescription_id) - 1
    next_short_prescription_id_index = previous_short_prescription_id_index + 2
    if previous_short_prescription_id_index >= 0:
        set_previous_prescription_id_cookie(response, short_prescription_ids[previous_short_prescription_id_index])
    else:
        reset_previous_prescription_id_cookie(response)
    if next_short_prescription_id_index < len(short_prescription_ids):
        set_next_prescription_id_cookie(response, short_prescription_ids[next_short_prescription_id_index])
    else:
        reset_next_prescription_id_cookie(response)
    set_current_prescription_id_cookie(response, current_short_prescription_id)


@app.route("/metadata", methods=["GET"])
@exclude_from_auth()
def get_metadata():
    return make_eps_api_metadata_request()


@app.route("/prescription/<short_prescription_id>", methods=["GET"])
def get_prescription(short_prescription_id):
    response = hapi_passthrough.get_prescription(str(short_prescription_id))
    return app.make_response(response)


@app.route("/tracker", methods=["GET"])
def get_tracker_prescription():
    hapi_response = hapi_passthrough.get_tracker_prescription(flask.request.query_string.decode("utf-8"))
    return app.make_response(hapi_response)


@app.route("/prescribe/edit", methods=["GET"])
def get_edit():
    # handles '+' in query_string where flask.request.args.get does not
    short_prescription_id = flask.request.query_string.decode("utf-8")[len("prescription_id="):]
    if short_prescription_id is None:
        return flask.redirect(f"{config.PUBLIC_APIGEE_URL}{config.BASE_URL}change-auth")
    hapi_passthrough.get_prescription(short_prescription_id)
    response = app.make_response(render_react_client("edit"))
    hapi_session = hapi_passthrough.get_hapi_session()
    short_prescription_ids = hapi_session["prescriptionIds"]
    short_prescription_id = hapi_session["prescriptionId"]
    update_pagination(response, short_prescription_ids, short_prescription_id)
    return response


@app.route("/prescribe/edit", methods=["POST"])
def post_edit():
    request_bundles = flask.request.json
    hapi_passthrough.post_edit(request_bundles)
    hapi_session = hapi_passthrough.get_hapi_session()
    short_prescription_ids = hapi_session["prescriptionIds"]
    short_prescription_id = hapi_session["prescriptionId"]
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}prescribe/edit?prescription_id={urllib.parse.quote_plus(short_prescription_id)}'
    response = app.make_response({"redirectUri": redirect_url})
    update_pagination(response, short_prescription_ids, short_prescription_id)
    return response


@app.route("/prescribe/sign", methods=["POST"])
def post_sign():
    hapi_response = hapi_passthrough.post_sign()
    return app.make_response(hapi_response)


@app.route("/prescribe/send", methods=["GET"])
def get_send():
    return render_react_client("send")


@app.route("/prescribe/send", methods=["POST"])
def post_send():
    return hapi_passthrough.post_send(flask.request.json)


@app.route("/prescribe/cancel", methods=["GET"])
def get_cancel():
    return render_react_client("cancel")


@app.route("/prescribe/cancel", methods=["POST"])
def post_cancel():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    response = hapi_passthrough.post_cancel(flask.request.json)
    return app.make_response(response)


@app.route("/validate", methods=["GET"])
def get_validate():
    return render_react_client("validate")


@app.route("/validate", methods=["POST"])
def post_validate():
    return hapi_passthrough.post_validate(flask.request.json)


@app.route("/dispense/release", methods=["GET"])
def get_release():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    return render_react_client("release")


@app.route("/dispense/release", methods=["POST"])
def post_release():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    response = hapi_passthrough.post_release(flask.request.json)
    return app.make_response(response)


@app.route("/dispense/release/<short_prescription_id>", methods=["GET"])
def get_released_prescriptions(short_prescription_id):
    response = hapi_passthrough.get_released_prescriptions(str(short_prescription_id))
    return app.make_response(json.dumps(response))


@app.route("/dispense/dispense", methods=["GET"])
def get_dispense():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    return render_react_client("dispense")


@app.route("/dispense/dispense", methods=["POST"])
def post_dispense():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    response = hapi_passthrough.post_dispense(flask.request.json)
    return app.make_response(response)


@app.route("/dispenseNotifications/<short_prescription_id>", methods=["GET"])
def get_dispense_notifications(short_prescription_id):
    response = hapi_passthrough.get_dispense_notifications(str(short_prescription_id))
    return app.make_response(json.dumps(response))


@app.route("/dispense/claim", methods=["GET"])
def get_claim():
    if config.ENVIRONMENT == "prod":
        return app.make_response("Bad Request", 400)
    return render_react_client("claim")


@app.route("/dispense/claim", methods=["POST"])
def post_claim():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    response = hapi_passthrough.post_claim(flask.request.json)
    return app.make_response(response)


@app.route("/logout", methods=["GET"])
def get_logout():
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
    response = flask.redirect(redirect_url)
    set_access_token_cookies(response, "", 0)
    set_session_cookie(response, "", 0)
    return response
