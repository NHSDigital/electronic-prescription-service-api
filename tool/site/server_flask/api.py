import uuid
import httpx
import time
import config
from jwt import JWT, jwk_from_dict, jwk_from_pem

raw_response_header = {
    "x-raw-response": "true"
}

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


def make_eps_api_process_message_request(access_token, body):
    print("Sending EPS process request...")
    request_id = str(uuid.uuid4())
    response = make_eps_api_request("$process-message", access_token, body, request_id)
    return response.json(), response.status_code, request_id


def make_eps_api_process_message_request_untranslated(access_token, body, request_id):
    print("Sending EPS process request...")
    response = make_eps_api_request("$process-message", access_token, body, request_id, raw_response_header)
    return response.text, response.status_code


def make_eps_api_convert_message_request(access_token, body):
    print("Sending EPS convert request...")
    response = make_eps_api_request("$convert", access_token, body)
    return response.text, response.status_code


def make_eps_api_release_request(access_token, body):
    print("Sending EPS release request...")
    request_id = str(uuid.uuid4())
    response = make_eps_api_request("Task/$release", access_token, body, request_id)
    return response.json(), response.status_code, request_id


def make_eps_api_release_request_untranslated(access_token, body, request_id):
    print("Sending EPS release request...")
    response = make_eps_api_request("Task/$release", access_token, body, request_id, raw_response_header)
    return response.text, response.status_code


def make_eps_api_claim_request(access_token, body):
    print("Sending EPS claim request...")
    request_id = str(uuid.uuid4())
    response = make_eps_api_request("Claim", access_token, body, request_id)
    return response.json(), response.status_code, request_id


def make_eps_api_claim_request_untranslated(access_token, body, request_id):
    print("Sending EPS claim request...")
    response = make_eps_api_request("Claim", access_token, body, request_id, raw_response_header)
    return response.text, response.status_code


def make_eps_api_request(path, access_token, body, request_id=str(uuid.uuid4()), additional_headers=None):
    headers = {
        "x-request-id": request_id,
        "x-correlation-id": str(uuid.uuid4()),
        "Authorization": f"Bearer {access_token}"
    }
    if additional_headers is not None:
        headers.update(additional_headers)
    return httpx.post(
        f"https://{config.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/{path}",
        headers=headers,
        json=body,
        verify=False,
    )
