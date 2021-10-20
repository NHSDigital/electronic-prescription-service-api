import datetime
import flask
import httpx
import os
from urllib.parse import urlencode
from app import fernet
from cookies import get_auth_method_from_cookie, set_session_cookie
from helpers import get_oauth_base_path, create_oauth_state, get_pr_number, get_registered_callback_url
import config
import hapi_passthrough

def set_access_token_cookies(response, access_token_encrypted, access_token_expiry):
    secure_flag = not config.DEV_MODE
    response.set_cookie("Access-Token", access_token_encrypted, expires=access_token_expiry, secure=secure_flag, httponly=True)
    response.set_cookie("Access-Token-Set", "true", expires=access_token_expiry, secure=secure_flag)
    return response


def exchange_code_for_token(code, auth_method):
    oauth_base_path = get_oauth_base_path(auth_method, False)
    token_response = httpx.post(
        f"{oauth_base_path}/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": get_registered_callback_url(),
            "client_id": config.DEMO_APP_CLIENT_ID,
            "client_secret": config.DEMO_APP_CLIENT_KEY,
        },
    )
    return token_response.json()

def refresh_token_session(refresh_token, auth_method):
    oauth_base_path = get_oauth_base_path(auth_method, False)
    token_response = httpx.post(
        f"{oauth_base_path}/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "redirect_uri": get_registered_callback_url(),
            "client_id": config.DEMO_APP_CLIENT_ID,
            "client_secret": config.DEMO_APP_CLIENT_KEY,
        },
    )
    return token_response.json()


def get_access_token():
    access_token_encrypted = flask.request.cookies.get("Access-Token")
    if access_token_encrypted is not None:
        return fernet.decrypt(access_token_encrypted.encode("utf-8")).decode("utf-8")


def login(response=None):
    # local environment
    if os.environ["ENVIRONMENT"].endswith("-sandbox"):
        session_cookie_value, _ = hapi_passthrough.post_login("")
        session_expiry = datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600))
        set_session_cookie(response, session_cookie_value, session_expiry)
        mock_access_token_encrypted = fernet.encrypt("mock_access_token".encode("utf-8")).decode("utf-8")
        set_access_token_cookies(response, mock_access_token_encrypted, session_expiry)
        return response
    # deployed environments
    page_mode = flask.request.args.get("page_mode", "home")
    state = create_oauth_state(get_pr_number(config.BASE_PATH), page_mode)
    auth_method = get_auth_method_from_cookie()
    authorize_url = get_authorize_url(state, auth_method)
    return flask.redirect(authorize_url)


def get_authorize_url(state, auth_method):
    oauth_base_path = get_oauth_base_path(auth_method, True)

    query_params = {
        "client_id": config.DEMO_APP_CLIENT_ID,
        "redirect_uri": get_registered_callback_url(),
        "response_type": "code",
        "state": state,
    }
    return f"{oauth_base_path}/authorize?{urlencode(query_params)}"
