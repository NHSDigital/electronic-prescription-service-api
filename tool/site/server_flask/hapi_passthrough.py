import json
import os
import httpx
from cookies import get_hapi_session_cookie_value

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
    session_cookie_value = response.cookies["session"]
    return session_cookie_value, response.json()


def get_prescription(prescription_id):
    return make_get_request(f"{HAPI_URL}/prescribe/edit?prescription_id={prescription_id}")


def post_edit(body):
    return make_post_request(f"{HAPI_URL}/prescribe/edit", body)


def post_sign():
    return make_post_request(f"{HAPI_URL}/prescribe/sign", {})


def post_send(body):
    return make_post_request(f"{HAPI_URL}/prescribe/send", body)


def get_prescription_ids():
    return make_get_request(f"{HAPI_URL}/prescriptionIds")


# Helpers

def make_get_request(url):
    return httpx.get(url, verify=False, cookies=get_cookies()).json()


def make_post_request(url, body):
    return httpx.get(url, json=body, verify=False, cookies=get_cookies()).json()


def get_cookies():
    session_cookie_value = get_hapi_session_cookie_value()
    return {"session": session_cookie_value}