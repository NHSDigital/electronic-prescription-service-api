import base64
import datetime
import io
import json
import zipfile
from functools import wraps
import flask
import urllib.parse
import config
from api import (
    make_eps_api_process_message_request,
    make_eps_api_process_message_request_untranslated,
    make_eps_api_release_request,
    make_eps_api_release_request_untranslated,
    make_eps_api_convert_message_request,
    make_eps_api_metadata_request,
    make_eps_api_claim_request,
    make_eps_api_claim_request_untranslated
)
from app import app, fernet
from auth import exchange_code_for_token, get_access_token, login, set_access_token_cookies, get_authorize_url
from bundle import get_prescription_id, create_provenance
from client import render_rivets_client, render_react_client
from cookies import (
    get_current_prescription_id_from_cookie,
    set_previous_prescription_id_cookie,
    set_current_prescription_id_cookie,
    set_next_prescription_id_cookie,
    reset_previous_prescription_id_cookie,
    reset_next_prescription_id_cookie,
    get_auth_method_from_cookie,
    set_auth_method_cookie,
    set_skip_signature_page_cookie,
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

HOME_URL = "/"
STATUS_URL = "/_status"
HEALTHCHECK_URL = "/_healthcheck"
AUTH_URL = "/change-auth"
LOGOUT_URL = "/logout"
CALLBACK_URL = "/callback"
LOAD_URL = "/prescribe/load"
DOWNLOAD_URL = "/download"
EDIT_URL = "/prescribe/edit"
SIGN_URL = "/prescribe/sign"
SEND_URL = "/prescribe/send"
CANCEL_URL = "/prescribe/cancel"
RELEASE_URL = "/dispense/release"
DISPENSE_URL = "/dispense/dispense"
CLAIM_URL = "/dispense/claim"
METADATA_URL = "/metadata"


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


@app.route(HEALTHCHECK_URL, methods=["GET"])
@exclude_from_auth()
def get_healthcheck():
    return hapi_passthrough.get_healthcheck()


@app.route(STATUS_URL, methods=["GET"])
@exclude_from_auth()
def get_status():
    return hapi_passthrough.get_status()


@app.route(AUTH_URL, methods=["GET"])
@exclude_from_auth()
def get_change_auth():
    return render_rivets_client("login")


@app.route(AUTH_URL, methods=["POST"])
@exclude_from_auth()
def post_change_auth():
    login_request = flask.request.json
    auth_method = login_request["authMethod"]
    if config.ENVIRONMENT.endswith("-sandbox"):
        authorize_url = "/callback"
    else:
        state = create_oauth_state(get_pr_number(config.BASE_PATH), "home")
        authorize_url = get_authorize_url(state, auth_method)
    response = app.make_response({"redirectUri": f'{authorize_url}'})
    set_auth_method_cookie(response, auth_method)
    return response


@app.route(HOME_URL, methods=["GET"])
@exclude_from_auth()
def get_home():
    return render_rivets_client("home")


@app.route("/search", methods=["GET"])
def get_search():
    return render_react_client("search")


@app.route(LOAD_URL, methods=["GET"])
@exclude_from_auth()
def get_load():
    return render_rivets_client("load")


@exclude_from_auth()
@app.route(DOWNLOAD_URL, methods=['GET'])
def download():
    zFile = io.BytesIO()
    access_token = get_access_token()
    hapi_session = hapi_passthrough.get_hapi_session()
    short_prescription_ids = hapi_session["prescriptionIds"]
    with zipfile.ZipFile(zFile, 'w') as zip_file:
        for index, short_prescription_id in enumerate(short_prescription_ids):
            bundle = hapi_passthrough.get_prescription(short_prescription_id)
            zip_file.writestr(f"prepare_request_{index + 1}.json", json.dumps(bundle, indent=2))
            # todo: fix 'invalid json' issue
            # if access_token:
            #     xml, _status_code = make_eps_api_convert_message_request(access_token, bundle)
            #     zip_file.writestr(f"prepare_request_{index + 1}.xml", xml)
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


@app.route(METADATA_URL, methods=["GET"])
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


@app.route(EDIT_URL, methods=["GET"])
@exclude_from_auth()
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


@app.route(EDIT_URL, methods=["POST"])
@exclude_from_auth()
def post_edit():
    request_bundles = flask.request.json
    hapi_passthrough.post_edit(request_bundles)
    hapi_session = hapi_passthrough.get_hapi_session()
    if "prescriptionId" not in hapi_session:
        # anonymous user view single prescription only
        bundle = request_bundles[0]
        short_prescription_id = get_prescription_id(bundle)
        short_prescription_ids = [short_prescription_id]
    else:
        short_prescription_ids = hapi_session["prescriptionIds"]
        short_prescription_id = hapi_session["prescriptionId"]
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}prescribe/edit?prescription_id={urllib.parse.quote_plus(short_prescription_id)}'
    response = app.make_response({"redirectUri": redirect_url})
    update_pagination(response, short_prescription_ids, short_prescription_id)
    return response


@app.route(SIGN_URL, methods=["GET"])
def get_sign():
    return render_rivets_client("sign")


@app.route(SIGN_URL, methods=["POST"])
def post_sign():
    hapi_response = hapi_passthrough.post_sign()
    response = app.make_response(hapi_response)
    set_skip_signature_page_cookie(response, "True")
    return response


@app.route(SEND_URL, methods=["GET"])
def get_send():
    return render_react_client("send")


@app.route(SEND_URL, methods=["POST"])
def post_send():
    return hapi_passthrough.post_send(flask.request.json)


@app.route(CANCEL_URL, methods=["GET"])
def get_cancel():
    return render_rivets_client("cancel")


@app.route(CANCEL_URL, methods=["POST"])
def post_cancel():
    request = flask.request.json
    short_prescription_id = get_prescription_id(request)
    access_token = get_access_token()

    convert_response, _code = make_eps_api_convert_message_request(access_token, request)
    cancel_response, cancel_response_code, request_id = make_eps_api_process_message_request(access_token, request)
    cancel_response_xml, _untranslated_code = make_eps_api_process_message_request_untranslated(
        access_token, request, request_id
    )
    return {
        "prescription_id": short_prescription_id,
        "success": cancel_response_code == 200,
        "request": request,
        "request_xml": convert_response,
        "response": cancel_response,
        "response_xml": cancel_response_xml
    }


@app.route(RELEASE_URL, methods=["GET"])
def get_release():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    return render_rivets_client("release")


@app.route(RELEASE_URL, methods=["POST"])
def post_release():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)

    request = flask.request.json
    access_token = get_access_token()

    convert_response, _code = make_eps_api_convert_message_request(access_token, request)
    release_response, release_response_code, request_id = make_eps_api_release_request(
        access_token,
        request,
    )
    release_response_xml, _untranslated_code = make_eps_api_release_request_untranslated(
        access_token,
        request,
        request_id
    )
    return {
        "success": release_response_code == 200,
        "request_xml": convert_response,
        "request": request,
        "response": release_response,
        "response_xml": release_response_xml
    }


@app.route(DISPENSE_URL, methods=["GET"])
def get_dispense():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    return render_react_client("dispense")


@app.route(DISPENSE_URL, methods=["POST"])
def post_dispense():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)
    response = hapi_passthrough.post_dispense(flask.request.json)
    return app.make_response(response)


@app.route("/dispenseNotifications/<short_prescription_id>", methods=["GET"])
def get_dispense_notifications(short_prescription_id):
    response = hapi_passthrough.get_dispense_notifications(str(short_prescription_id))
    return app.make_response(json.dumps(response))


@app.route(CLAIM_URL, methods=["GET"])
def get_claim():
    if config.ENVIRONMENT == "prod":
        return app.make_response("Bad Request", 400)
    return render_react_client("claim")


@app.route(CLAIM_URL, methods=["POST"])
def post_claim():
    if config.ENVIRONMENT == "prod":
        return app.make_response("Bad Request", 400)

    request = flask.request.json
    access_token = get_access_token()

    convert_response, _code = make_eps_api_convert_message_request(access_token, request)
    claim_response, claim_response_code, request_id = make_eps_api_claim_request(
        access_token,
        request
    )
    claim_response_xml, _untranslated_code = make_eps_api_claim_request_untranslated(
        access_token,
        request,
        request_id
    )

    return {
        "success": claim_response_code == 200,
        "request_xml": convert_response,
        "request": request,
        "response": claim_response,
        "response_xml": claim_response_xml
    }


@app.route(LOGOUT_URL, methods=["GET"])
def get_logout():
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
    response = flask.redirect(redirect_url)
    set_access_token_cookies(response, "", 0)
    set_session_cookie(response, "", 0)
    return response


@app.route(CALLBACK_URL, methods=["GET"])
@exclude_from_auth()
def get_callback():
    # local development
    if config.ENVIRONMENT.endswith("-sandbox"):
        hapi_session_cookie, _ = hapi_passthrough.post_login("", "")
        session_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600))
        response = flask.redirect(config.BASE_URL)
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
    auth_method = get_auth_method_from_cookie()
    token_response_json = exchange_code_for_token(code, auth_method)
    access_token = token_response_json["access_token"]
    refresh_token = token_response_json["refresh_token"]
    access_token_expires_in = token_response_json["expires_in"]
    refresh_token_expires_in = token_response_json["refresh_token_expires_in"]
    access_token_encrypted = fernet.encrypt(access_token.encode("utf-8")).decode("utf-8")
    refresh_token_encrypted = fernet.encrypt(refresh_token.encode("utf-8")).decode("utf-8")
    access_token_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(access_token_expires_in))
    refresh_token_expires = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(refresh_token_expires_in))
    hapi_session_cookie, _ = hapi_passthrough.post_login(auth_method, access_token)
    redirect_url = f'{config.PUBLIC_APIGEE_URL}{config.BASE_URL}'
    response = flask.redirect(redirect_url)
    set_session_cookie(response, hapi_session_cookie, access_token_expires)
    set_access_token_cookies(response, access_token_encrypted, access_token_expires)
    return response
