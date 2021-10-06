import httpx

HAPI_HOST = "http://localhost:9001"
STATUS_URL = "/_status"

def get_status():
    return httpx.get(
        f"{HAPI_HOST}{STATUS_URL}",
        verify=False,
    ).json()
