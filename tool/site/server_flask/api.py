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

def make_eps_api_prepare_request(access_token, body):
    print("Sending EPS prepare request...")
    response = make_eps_api_request("$prepare", access_token, body)
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


# def make_sign_api_signature_upload_request(auth_method, access_token, prepare_responses):
#     jwt_client = JWT()
#     public_signing_base_url = get_signing_base_path(auth_method, True)

#     # patch for RSS support whilst requirements for local signing and RSS are different
#     # todo: remove this logic once they are aligned
#     if auth_method == "cis2":
#         pem = get_pem(config.DEMO_APP_LOCAL_SIGNING_PRIVATE_KEY)
#         sub = config.APP_SIGNING_SUBJECT
#         iss = config.DEMO_APP_CLIENT_ID
#         kid = config.DEMO_APP_KEY_ID
#     else:  # always 'simulated' (this will only support RSS Windows/IOS, smartcard simulated auth will fail as JWTs are different)
#         pem = get_pem(config.DEMO_APP_REMOTE_SIGNING_PRIVATE_KEY)
#         sub = config.APP_SIGNING_SUBJECT
#         iss = config.DEMO_APP_REMOTE_SIGNING_ISSUER
#         kid = config.DEMO_APP_REMOTE_SIGNING_KID

#     signing_key = jwk_from_pem(pem)

#     jwt_request = jwt_client.encode(
#         {
#             "sub": sub,
#             "iss": iss,
#             "aud": public_signing_base_url,
#             "iat": time.time(),
#             "exp": time.time() + 600,
#             "payloads": list(map(createPayload, prepare_responses)),
#             "algorithm": prepare_responses[0]["algorithm"], # todo: question this mapping, do we validate all same alg ???
#         },
#         signing_key,
#         alg="RS512",
#         optional_headers={"kid": kid},
#     )

#     print("Sending Signing Service signature upload request...")
#     signing_base_url = get_signing_base_path(auth_method, False)
#     return httpx.post(
#         f"{signing_base_url}/signaturerequest",
#         headers={"Content-Type": "text/plain", "Authorization": f"Bearer {access_token}"},
#         data=jwt_request,
#         verify=False,
#     ).json()


def createPayload(prepare_response):
    payload = {
        "id": str(uuid.uuid4()),
        "payload": prepare_response["digest"]
    }
    return payload


def get_signing_base_path(auth_method, public):
    apigee_url = config.PUBLIC_APIGEE_URL if public else f"https://{config.APIGEE_DOMAIN_NAME}"
    if auth_method == "simulated" and config.ENVIRONMENT == "int":
        return f"{apigee_url}/signing-service-no-smartcard"
    else:
        return f"{apigee_url}/signing-service"
