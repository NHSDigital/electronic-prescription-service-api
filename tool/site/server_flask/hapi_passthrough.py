import json
import os
import httpx
from cookies import get_hapi_session_cookie_value


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


def get_prescription(prescription_id):
    session_cookie_value = get_hapi_session_cookie_value()
    return httpx.get(
        f"{HAPI_URL}{EDIT_URL}?prescription_id={prescription_id}",
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def post_edit(body):
    session_cookie_value = get_hapi_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{EDIT_URL}",
        json=body,
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def post_sign():
    session_cookie_value = get_hapi_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{SIGN_URL}",
        json={},
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def post_send():
    session_cookie_value = get_hapi_session_cookie_value()
    return httpx.post(
        f"{HAPI_URL}{SEND_URL}",
        json={},
        verify=False,
        cookies={
            "session": session_cookie_value
        }
    ).json()


def post_login(access_token):
    response =  httpx.post(
        f"{HAPI_URL}{AUTH_URL}",
        json={
            "access_token": access_token
        },
        verify=False
    )
    session_cookie_value = response.cookies["session"]
    return session_cookie_value, response.json()


def get_prescription_ids(hapi_session_key):
    cookies = {
        "session": hapi_session_key
    }
    return make_get_request_raw(f"{HAPI_URL}/prescriptionIds", cookies)

# Helpers

def make_get_request_raw(url, cookies=None):
    if cookies is None:
        cookies = get_cookies()
    return httpx.get(url, verify=False, cookies=cookies).json()