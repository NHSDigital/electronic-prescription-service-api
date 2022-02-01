import json
import os
import httpx
from cookies import get_session_cookie

HAPI_URL = os.environ["HAPI_URL"]

# Health

def get_status():
    return httpx.get(f"{HAPI_URL}/_status", verify=False).json()


def get_healthcheck():
    return httpx.get(f"{HAPI_URL}/_healthcheck", verify=False).json()


# Login

def get_unattended_access_token():
    return make_get_request(f"{HAPI_URL}/get-unattended-access-token")


def post_set_session(access_token, auth_level, auth_method=None):
    body = {
        "access_token": access_token,
        "auth_level": auth_level
    }
    if auth_method:
        body["auth_method"] = auth_method

    response =  httpx.post(
        f"{HAPI_URL}/set-session",
        json=body,
        verify=False
    )
    hapi_session_cookie = response.cookies["session"]
    return hapi_session_cookie, response.json()


# Send Prescription User-Journey

def get_prescription(prescription_id):
    return make_get_request(f"{HAPI_URL}/prescription/{prescription_id}")


def post_edit(body):
    return make_post_request(f"{HAPI_URL}/prescribe/edit", body)


def post_sign():
    return make_post_request(f"{HAPI_URL}/prescribe/sign", {})


def post_send(body):
    return make_post_request(f"{HAPI_URL}/prescribe/send", body)


def post_cancel(body):
    return make_post_request(f"{HAPI_URL}/prescribe/cancel", body)


# Dispense

def get_released_prescriptions(prescription_id):
    return make_get_request(f"{HAPI_URL}/dispense/release/{prescription_id}")


def post_release(body):
    return make_post_request(f"{HAPI_URL}/dispense/release", body)


def post_return(body):
    return make_post_request(f"{HAPI_URL}/dispense/return", body)


def post_withdraw(body):
    return make_post_request(f"{HAPI_URL}/dispense/withdraw", body)


def get_dispense_notifications(prescription_id):
    return make_get_request(f"{HAPI_URL}/dispenseNotifications/{prescription_id}")


def post_dispense(body):
    return make_post_request(f"{HAPI_URL}/dispense/dispense", body)


def post_claim(body):
    return make_post_request(f"{HAPI_URL}/dispense/claim", body)


# Tracker

def get_tracker_prescription(query):
    return make_get_request(f"{HAPI_URL}/search?{query}")

# Validator

def post_validate(body):
    return make_post_request(f"{HAPI_URL}/validate", body)


# Session

def get_hapi_session():
    return make_get_request(f"{HAPI_URL}/session")


def get_prescriptions():
    return make_get_request(f"{HAPI_URL}/prescriptions")


# Helpers

def make_get_request(url):
    timeout = httpx.Timeout(60.0, connect=10.0)
    client = httpx.Client(timeout=timeout, verify=False, cookies=get_cookies())
    return client.get(url).json()


def make_post_request(url, body):
    timeout = httpx.Timeout(60.0, connect=10.0)
    client = httpx.Client(timeout=timeout, verify=False, cookies=get_cookies())
    return client.post(url, json=body).json()


def get_cookies():
    hapi_session_cookie = get_session_cookie()
    if hapi_session_cookie is not None:
        return {"session": hapi_session_cookie}
    return {}
