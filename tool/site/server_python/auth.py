import flask
import os
import httpx
import json
from urllib.parse import urlencode
from app import app, fernet
from cookies import get_auth_method_from_cookie
from helpers import get_oauth_base_path, create_oauth_state, get_pr_number, get_registered_callback_url
import config


def redirect_and_set_cookies(page_mode, access_token_encrypted, refresh_token_encrypted, access_token_expiry, refresh_token_expiry):
    redirect_url = f'{config.PUBLIC_APIGEE_URL}/{config.BASE_PATH}'
    callback_response = flask.redirect(redirect_url)
    secure_flag = not config.DEV_MODE
    # todo: refresh token implementation
    # callback_response.set_cookie(
    #     "Access-Token", access_token_encrypted, expires=refresh_token_expiry, secure=secure_flag, httponly=True
    # )
    # callback_response.set_cookie(
    #     "Refresh-Token", refresh_token_encrypted, expires=refresh_token_expiry, secure=secure_flag, httponly=True
    # )
    callback_response.set_cookie(
        "Access-Token", access_token_encrypted, expires=access_token_expiry, secure=secure_flag, httponly=True
    )
    callback_response.set_cookie(
        "Refresh-Token", refresh_token_encrypted, expires=access_token_expiry, secure=secure_flag, httponly=True
    )
    # callback_response.set_cookie(
    #     "Access-Token-Session", "True", expires=access_token_expiry, secure=secure_flag, httponly=True
    # )
    # callback_response.set_cookie("Access-Token-Set", "true", expires=refresh_token_expiry, secure=secure_flag)
    callback_response.set_cookie("Access-Token-Set", "true", expires=access_token_expiry, secure=secure_flag)
    return callback_response


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


def login():
    page_mode = flask.request.args.get("page_mode", "home")
    state = create_oauth_state(get_pr_number(config.BASE_PATH), page_mode)
    auth_method = get_auth_method_from_cookie()
    authorize_url = get_authorize_url(state, auth_method)
    response = flask.redirect(authorize_url)
    return response


def get_authorize_url(state, auth_method):
    oauth_base_path = get_oauth_base_path(auth_method, True)

    query_params = {
        "client_id": config.DEMO_APP_CLIENT_ID,
        "redirect_uri": get_registered_callback_url(),
        "response_type": "code",
        "state": state,
    }
    return f"{oauth_base_path}/authorize?{urlencode(query_params)}"