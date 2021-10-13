import os
import httpx

HAPI_URL = os.environ["HAPI_URL"]
STATUS_URL = "/_status"
HEALTHCHECK_URL = "/_healthcheck"
EDIT_URL = "/prescribe/edit"


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


def post_edit(body):
    return httpx.post(
        f"{HAPI_URL}{EDIT_URL}",
        json=body,
        verify=False,
    ).json()
