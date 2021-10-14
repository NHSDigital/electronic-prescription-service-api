import json
import os
import httpx
from auth import get_access_token
from cookies import get_session_cookie_value


HAPI_URL = os.environ["HAPI_URL"]
STATUS_URL = "/_status"
HEALTHCHECK_URL = "/_healthcheck"
EDIT_URL = "/prescribe/edit"
SIGN_URL = "/prescribe/sign"
SEND_URL = "/prescribe/send"
AUTH_URL = "/login"


def get_status():
    return httpx.get(
        f"{HAPI_URL}{STATUS_URL}",
        verify=False,
    ).json()


def get_healthcheck():
    return httpx.get(
        f"{HAPI_URL}{HEALTHCHECK_URL}",
        verify=False,
    ).json()


def get_edit(prescription_id):
    response = httpx.get(
        f"{HAPI_URL}{EDIT_URL}?{prescription_id}",
        verify=False,
    )
    session_cookie_value = response.cookies["session"]
    return session_cookie_value, response.json()


def post_edit(body):
    response = httpx.post(
        f"{HAPI_URL}{EDIT_URL}",
        json=body,
        verify=False,
    )
    session_cookie_value = response.cookies["session"]
    return session_cookie_value, response.json()


def post_sign():
    session_cookie_value = get_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{SIGN_URL}",
        json={},
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def get_send():
    session_cookie_value = get_session_cookie_value()
    return httpx.get(
        f"{HAPI_URL}{SEND_URL}",
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()

def post_send():
    session_cookie_value = get_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{SEND_URL}",
        json={},
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def get_login():
    session_cookie_value = get_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{AUTH_URL}",
        json={
            "access_token": get_access_token()
        },
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()
