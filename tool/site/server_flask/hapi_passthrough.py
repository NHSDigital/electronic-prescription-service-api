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


# Send Prescription User-Journey

def get_prescription(prescription_id):
    return make_get_request(f"{HAPI_URL}/prescription/{prescription_id}")


def post_edit(body):
    return make_post_request(f"{HAPI_URL}/prescribe/edit", body)


def post_sign():
    return make_post_request(f"{HAPI_URL}/prescribe/sign", {})


def post_send(body):
    return make_post_request(f"{HAPI_URL}/prescribe/send", body)


# Dispense

def get_dispense_notifications(prescription_id):
    return make_get_request(f"{HAPI_URL}/dispenseNotifications/{prescription_id}")


def post_dispense(body):
    return make_post_request(f"{HAPI_URL}/dispense/dispense", body)


# Tracker

def get_tracker_prescription(query):
    return make_get_request(f"{HAPI_URL}/search?{query}")


# Session

def get_hapi_session():
    return make_get_request(f"{HAPI_URL}/session")


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
