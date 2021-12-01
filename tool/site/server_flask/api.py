import uuid
import httpx
import time
import config
from jwt import JWT, jwk_from_dict, jwk_from_pem


def make_eps_api_metadata_request():
    print("Sending EPS metadata request...")
    headers = {
        "x-request-id": str(uuid.uuid4()),
    }
    response = httpx.get(
        f"https://{config.APIGEE_DOMAIN_NAME}/electronic-prescriptions/metadata",
        headers=headers,
        verify=False,
    )
    return response.json(), response.status_code
