import os
import httpx


HAPI_URL = os.environ["HAPI_URL"]
STATUS_URL = "/_status"

def get_status():
    return httpx.get(
        f"{HAPI_URL}{STATUS_URL}",
        verify=False,
    ).json()
