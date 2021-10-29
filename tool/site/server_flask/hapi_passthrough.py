import json
import os
import httpx
from cookies import get_session_cookie

HAPI_URL = os.environ["HAPI_URL"]


def get_status():
    return httpx.get(f"{HAPI_URL}/_status", verify=False).json()


def get_healthcheck():
    return httpx.get(f"{HAPI_URL}/_healthcheck", verify=False).json()


def post_login(auth_method, access_token):
    response =  httpx.post(
        f"{HAPI_URL}/login",
        json={
            "auth_method": auth_method,
            "access_token": access_token
        },
        verify=False
    )
    hapi_session_cookie = response.cookies["session"]
    return hapi_session_cookie, response.json()


def get_edit(prescription_id):
    return make_get_request(f"{HAPI_URL}/prescribe/edit?prescription_id={prescription_id}")


def post_edit(body):
    return make_post_request(f"{HAPI_URL}/prescribe/edit", body)


def post_sign():
    return make_post_request(f"{HAPI_URL}/prescribe/sign", {})


def post_send(body):
    return make_post_request(f"{HAPI_URL}/prescribe/send", body)


def get_hapi_session():
    return make_get_request(f"{HAPI_URL}/session")


# Helpers

def make_get_request(url):
    return httpx.get(url, verify=False, cookies=get_cookies()).json()


def make_post_request(url, body):
    return httpx.post(url, json=body, verify=False, cookies=get_cookies()).json()


def get_cookies():
    hapi_session_cookie = get_session_cookie()
    if hapi_session_cookie is not None:
        return {"session": hapi_session_cookie}
    return {}