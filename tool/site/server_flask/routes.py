import base64
import datetime
import io
import json
import zipfile
from functools import wraps
import flask
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
from auth import exchange_code_for_token, get_access_token, login, set_access_token_cookies
from bundle import get_prescription_id, create_provenance
from client import render_client
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
    set_session_cookie,
    get_hapi_session_cookie_value
)
from helpers import (
    pr_redirect_required,
    pr_redirect_enabled,
    get_pr_branch_url,
    parse_oauth_state
)
from store import (
    add_prepare_request,
    add_prepare_response,
    add_prescription_order_send_request,
    load_prepare_request,
    load_prepare_response,
    load_prescription_order_send_request,
    contains_prepare_response,
    contains_prescription_order_send_request,
    add_dispense_notification_send_request,
    load_dispense_notification_send_requests,
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
DISPENSING_HISTORY_URL = "/dispense/history"
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

    # mock login for local development
    if config.ENVIRONMENT.endswith("-sandbox"):
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
    return render_client("login")


@app.route(AUTH_URL, methods=["POST"])
@exclude_from_auth()
def post_change_auth():
    login_request = flask.request.json
    auth_method = login_request["authMethod"]
    response = app.make_response({"redirectUri": f'{config.BASE_URL}logout'})
    set_auth_method_cookie(response, auth_method)
    secure_flag = not config.DEV_MODE
    response.set_cookie("Access-Token", "", expires=0, secure=secure_flag, httponly=True)
    response.set_cookie("Access-Token-Set", "false", expires=0, secure=secure_flag)
    return response


@app.route(HOME_URL, methods=["GET"])
@exclude_from_auth()
def get_home():
    return render_client("home")


@app.route(LOAD_URL, methods=["GET"])
@exclude_from_auth()
def get_load():
    return render_client("load")


@exclude_from_auth()
@app.route(DOWNLOAD_URL, methods=['GET'])
def download():
    zFile = io.BytesIO()
    access_token = get_access_token()
    state = hapi_passthrough.get_prescription_ids(hapi_session_cookie_value)
    short_prescription_ids = state["prescriptionIds"]
    with zipfile.ZipFile(zFile, 'w') as zip_file:
        for index, short_prescription_id in enumerate(short_prescription_ids):
            bundle = load_prepare_request(short_prescription_id)
            zip_file.writestr(f"send_request_{index + 1}.json", json.dumps(bundle, indent=2))
            if access_token:
                xml, _status_code = make_eps_api_convert_message_request(access_token, bundle)
                zip_file.writestr(f"send_request_{index + 1}.xml", xml)
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


@app.route(EDIT_URL, methods=["GET"])
@exclude_from_auth()
def get_edit():
    # handles '+' in query_string where flask.request.args.get does not
    short_prescription_id = flask.request.query_string.decode("utf-8")[len("prescription_id="):]
    if short_prescription_id is None:
        return flask.redirect(f"{config.BASE_URL}change-auth")
    response_json = hapi_passthrough.get_prescription(short_prescription_id)
    response = app.make_response(response_json)
    hapi_session_cookie_value = get_hapi_session_cookie_value()
    state = hapi_passthrough.get_prescription_ids(hapi_session_cookie_value)
    short_prescription_ids = state["prescriptionIds"]
    short_prescription_id = state["prescriptionId"]
    update_pagination(response, short_prescription_ids, short_prescription_id)
    return response


@app.route(EDIT_URL, methods=["POST"])
@exclude_from_auth()
def post_edit():
    request_bundles = flask.request.json
    hapi_session_cookie_value, response_json = hapi_passthrough.post_edit(request_bundles)
    response = app.make_response(response_json)
    state = hapi_passthrough.get_prescription_ids(hapi_session_cookie_value)
    short_prescription_ids = state["prescriptionIds"]
    short_prescription_id = state["prescriptionId"]
    update_pagination(response, short_prescription_ids, short_prescription_id)
    # when in local mode, we might not have session cookie at this point
    # as we've skipped login, so ensure it is set here
    if get_hapi_session_cookie_value() is None:
        set_session_cookie(response, hapi_session_cookie_value)
    return response


@app.route(SIGN_URL, methods=["GET"])
def get_sign():
    return render_client("sign")


@app.route(SIGN_URL, methods=["POST"])
def post_sign():
    hapi_response = hapi_passthrough.post_sign()
    response = app.make_response(hapi_response)
    set_skip_signature_page_cookie(response, "True")
    return response


@app.route(SEND_URL, methods=["GET"])
def get_send():
    hapi_passthrough.get_send()
    return render_client("send", sign_response={"signature": ""})


@app.route(SEND_URL, methods=["POST"])
def post_send():
    return hapi_passthrough.post_send()


@app.route(CANCEL_URL, methods=["GET"])
def get_cancel():
    return render_client("cancel")


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
    return render_client("release")


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
    return render_client("dispense")


@app.route(DISPENSE_URL, methods=["POST"])
def post_dispense():
    if (config.ENVIRONMENT == "prod"):
        return app.make_response("Bad Request", 400)

    request = flask.request.json
    short_prescription_id = get_prescription_id(request)
    access_token = get_access_token()

    convert_response, _code = make_eps_api_convert_message_request(access_token, request)
    dispense_response, dispense_response_code, request_id = make_eps_api_process_message_request(
        access_token,
        request
    )
    dispense_response_xml, _untranslated_code = make_eps_api_process_message_request_untranslated(
        access_token,
        request,
        request_id
    )
    success = dispense_response_code == 200
    if success:
        add_dispense_notification_send_request(short_prescription_id, request)

    return {
        "success": success,
        "request_xml": convert_response,
        "request": request,
        "response": dispense_response,
        "response_xml": dispense_response_xml
    }


@app.route(DISPENSING_HISTORY_URL, methods=["GET"])
def get_dispensing_history():
    short_prescription_id = flask.request.args.get("prescription_id")
    if not contains_prescription_order_send_request(short_prescription_id):
        return {}
    prescription_order = load_prescription_order_send_request(short_prescription_id)
    dispense_notifications = load_dispense_notification_send_requests(short_prescription_id)
    return {
        "prescription_order": prescription_order,
        "dispense_notifications": dispense_notifications
    }


@app.route(CLAIM_URL, methods=["GET"])
def get_claim():
    if config.ENVIRONMENT == "prod":
        return app.make_response("Bad Request", 400)
    return render_client("claim")


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
    redirect_url = f'{config.PUBLIC_APIGEE_URL}/{config.BASE_PATH}'
    response = flask.redirect(redirect_url)
    return set_access_token_cookies(response, "", 0)


@app.route(CALLBACK_URL, methods=["GET"])
@exclude_from_auth()
def get_callback():
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
    session_cookie_value, _ = hapi_passthrough.post_login(access_token)
    redirect_url = f'{config.PUBLIC_APIGEE_URL}/{config.BASE_PATH}'
    response = flask.redirect(redirect_url)
    set_session_cookie(response, session_cookie_value)
    return set_access_token_cookies(response, access_token_encrypted, access_token_expires)
