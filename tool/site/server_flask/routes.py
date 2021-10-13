import base64
import datetime
import io
import json
import zipfile
from functools import wraps
import flask
import config
from api import (
    make_eps_api_prepare_request,
    make_eps_api_process_message_request,
    make_eps_api_process_message_request_untranslated,
    make_eps_api_release_request,
    make_eps_api_release_request_untranslated,
    make_sign_api_signature_upload_request,
    make_sign_api_signature_download_request,
    make_eps_api_convert_message_request,
    make_eps_api_metadata_request,
    make_eps_api_claim_request,
    make_eps_api_claim_request_untranslated
)
from app import app, fernet
from auth import exchange_code_for_token, get_access_token, login, redirect_and_set_cookies
from bundle import get_prescription_id, create_provenance
from client import render_client
from cookies import (
    get_current_prescription_id_from_cookie,
    set_previous_prescription_id_cookie,
    set_current_prescription_id_cookie,
    set_next_prescription_id_cookie,
    reset_previous_prescription_id_cookie,
    reset_next_prescription_id_cookie,
    set_prescription_ids_cookie,
    get_all_prescription_ids_from_cookie,
    get_auth_method_from_cookie,
    set_auth_method_cookie,
    set_skip_signature_page_cookie,
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
                # todo: refresh token implementation
                access_token = fernet.decrypt(access_token_encrypted.encode("utf-8")).decode("utf-8")
                # access_token_session = flask.request.cookies.get("Access-Token-Session")
                # refresh_token_encrypted = flask.request.cookies.get("Refresh-Token")
                # auth_method = get_auth_method_from_cookie()
                # if not access_token_session:
                #     refresh_token = fernet.decrypt(refresh_token_encrypted.encode("utf-8")).decode("utf-8")
                #     token_response = refresh_token_session(refresh_token, auth_method)
                #     print("Refreshed token session. Got response...")
                #     print(json.dumps(token_response))
                #     access_token_expiry = token_response["expires_in"]
                #     callback_response.set_cookie(
                #         "Access-Token-Session", "True", expires=access_token_expiry, secure=secure_flag, httponly=True
                #     )
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
    response.set_cookie("Refresh-Token", "", expires=0, secure=secure_flag)
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
    with zipfile.ZipFile(zFile, 'w') as zip_file:
        short_prescription_ids = get_all_prescription_ids_from_cookie()
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
    set_prescription_ids_cookie(response, short_prescription_ids)
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
    bundle = load_prepare_request(short_prescription_id)
    response = app.make_response({
        "bundle": bundle
    })
    short_prescription_ids = get_all_prescription_ids_from_cookie()
    update_pagination(response, short_prescription_ids, short_prescription_id)
    return response


@app.route(EDIT_URL, methods=["POST"])
@exclude_from_auth()
def post_edit():
    request_bundles = flask.request.json
    short_prescription_ids = []
    for bundle in request_bundles:
        short_prescription_id = get_prescription_id(bundle)
        short_prescription_ids.append(short_prescription_id)
        add_prepare_request(short_prescription_id, bundle)
    first_bundle = request_bundles[0]
    current_short_prescription_id = get_prescription_id(first_bundle)
    response = app.make_response({
        "bundle": first_bundle,
        "errors": []
        # todo: make a $validate call against ?sandbox? for non-authed users to provide validation errors against test-pack/individual prescription
    })
    update_pagination(response, short_prescription_ids, current_short_prescription_id)
    return response


@app.route(SIGN_URL, methods=["GET"])
def get_sign():
    return render_client("sign")


@app.route(SIGN_URL, methods=["POST"])
def post_sign():
    all_prescription_ids = get_all_prescription_ids_from_cookie()
    # mock sign for local development
    if config.ENVIRONMENT.endswith("-sandbox"):
        for short_prescription_id in all_prescription_ids:
            prepare_response = {
                "digest": "PFNpZ25lZEluZm8geG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L0Nhbm9uaWNhbGl6YXRpb25NZXRob2Q+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSI+PC9TaWduYXR1cmVNZXRob2Q+PFJlZmVyZW5jZT48VHJhbnNmb3Jtcz48VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L1RyYW5zZm9ybT48L1RyYW5zZm9ybXM+PERpZ2VzdE1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNzaGExIj48L0RpZ2VzdE1ldGhvZD48RGlnZXN0VmFsdWU+Q2VwU0dqM3JoZm93MmdDUHlSUHdMVkVnejZNPTwvRGlnZXN0VmFsdWU+PC9SZWZlcmVuY2U+PC9TaWduZWRJbmZvPg==",
                "algorithm": "RS1",
                "timestamp": "2021-05-07T14:47:58+00:00"
            }
            add_prepare_response(short_prescription_id, prepare_response)
        response = app.make_response({
            "redirectUri": f'{config.BASE_URL}prescribe/send'
        })
        # todo: deprecate signature page
        set_skip_signature_page_cookie(response, "True")
        return response
    # prepare and sign
    prepare_successes = []
    prepare_errors = []
    for short_prescription_id in all_prescription_ids:
        prepare_request = load_prepare_request(short_prescription_id)
        prepare_response, status_code = make_eps_api_prepare_request(get_access_token(), prepare_request)
        if status_code == 200:
            prepare_response = {p["name"]: p["valueString"] for p in prepare_response["parameter"]}
            add_prepare_response(short_prescription_id, prepare_response)
            prepare_successes.append(prepare_response)
        else:
            prepare_errors.append(prepare_response)
    # todo: error handling for prepare and sign errors
    #   response = app.make_response({
    #     "prepareSuccesses": prepare_successes,
    #     "prepareErrors": prepare_errors
    #   })
    auth_method = get_auth_method_from_cookie()
    sign_response = make_sign_api_signature_upload_request(
        auth_method, get_access_token(), prepare_successes
    )
    response = app.make_response(sign_response)
    # todo: deprecate signature page
    set_skip_signature_page_cookie(response, "True")
    return response


@app.route(SEND_URL, methods=["GET"])
def get_send():
    auth_method = get_auth_method_from_cookie()
    # mocked in local development
    signature_response = make_sign_api_signature_download_request(
        auth_method, get_access_token(), flask.request.args.get("token")
    )
    short_prescription_id = get_current_prescription_id_from_cookie()
    if short_prescription_id is None:
        return flask.redirect(f"{config.BASE_URL}change-auth")

    prepare_responses = [
        (short_prescription_id, load_prepare_response(short_prescription_id))
        for short_prescription_id in get_all_prescription_ids_from_cookie()
        if contains_prepare_response(short_prescription_id)
    ]

    for index, (short_prescription_id, prepare_response) in enumerate(prepare_responses):
        payload = prepare_response["digest"]
        signature = signature_response["signatures"][index]["signature"]
        certificate = signature_response["certificate"]
        payload_decoded = (
            base64.b64decode(payload)
                .decode("utf-8")
                .replace('<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">', "<SignedInfo>")
        )
        xml_dsig = (
            f'<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">{payload_decoded}'
            f"<SignatureValue>{signature}</SignatureValue>"
            f"<KeyInfo><X509Data><X509Certificate>{certificate}</X509Certificate></X509Data></KeyInfo>"
            f"</Signature>"
        )
        xml_dsig_encoded = base64.b64encode(xml_dsig.encode("utf-8")).decode("utf-8")
        prepare_request = load_prepare_request(short_prescription_id)
        provenance = create_provenance(prepare_response["timestamp"], xml_dsig_encoded)
        prepare_request["entry"].append(provenance)
        send_request = prepare_request
        add_prescription_order_send_request(short_prescription_id, send_request)
    # todo: deprecate sign response page, instead go straight to send
    return render_client("send", sign_response={"signature": ""})


@app.route(SEND_URL, methods=["POST"])
def post_send():
    access_token = get_access_token()
    session_short_prescription_ids = get_all_prescription_ids_from_cookie()
    if len(session_short_prescription_ids) == 1:
        return post_send_single(session_short_prescription_ids, access_token)
    else:
        return post_send_bulk(session_short_prescription_ids, access_token)


def post_send_single(short_prescription_ids, access_token):
    short_prescription_id = short_prescription_ids[0]
    send_response_success = False
    send_request = ""
    send_request_xml = ""
    send_response = ""
    send_response_xml = ""
    if contains_prescription_order_send_request(short_prescription_id):
        send_request = load_prescription_order_send_request(short_prescription_id)
        send_response, send_response_code, request_id = make_eps_api_process_message_request(access_token, send_request)
        send_response_success = send_response_code == 200
        send_request_xml, _code = make_eps_api_convert_message_request(access_token, send_request)
        send_response_xml, _untranslated_code = make_eps_api_process_message_request_untranslated(
            access_token, send_request, request_id
        )

    return {
        "prescription_ids": short_prescription_ids,
        "prescription_id": short_prescription_id,
        "success": send_response_success,
        "request_xml": send_request_xml,
        "request": send_request,
        "response": send_response,
        "response_xml": send_response_xml
    }


def post_send_bulk(short_prescription_ids, access_token):
    success_list = []

    for short_prescription_id in short_prescription_ids:
        if contains_prescription_order_send_request(short_prescription_id):
            send_request = load_prescription_order_send_request(short_prescription_id)
            _, send_response_code, _ = make_eps_api_process_message_request(access_token, send_request)
            success_list.append({
                "prescription_id": short_prescription_id,
                "success": send_response_code == 200
            })
        else:
            success_list.append({
                "prescription_id": short_prescription_id,
                "success": False
            })

    return {
        "prescription_ids": short_prescription_ids,
        "success_list": success_list,
    }


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
    return redirect_and_set_cookies("login", "", "", 0, 0)


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
    page_mode = state["pageMode"]
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
    return redirect_and_set_cookies(page_mode, access_token_encrypted, refresh_token_encrypted, access_token_expires,
                                    refresh_token_expires)
