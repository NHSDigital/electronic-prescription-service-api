import os
import unittest

import requests
from requests import Response

ORG_CODE_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/ods-organization-code"
SERVICE_ID_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/nhsServiceInteractionId"
PARTY_KEY_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/nhsMhsPartyKey"
MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/ods-organization-code"


class SdsHttpRequestBuilder:
    def __init__(self, path: str):
        self.method = "GET"
        self.headers = {}
        self.query_params = {}
        self.path = path
        self.sds_host = os.environ.get('SDS_ADDRESS', 'http://localhost:9000')
        self.assertions = unittest.TestCase('__init__')

    def with_path(self, path):
        self.path = path
        return self

    def with_method(self, method):
        self.method = method
        return self

    def with_org_code(self, org_code: str, fhir_code=ORG_CODE_FHIR_IDENTIFIER):
        params = self.query_params.get('organization', [])
        params.append(f"{fhir_code}|{org_code}")
        self.query_params['organization'] = params
        return self

    def with_service_id(self, service_id: str, fhir_code=SERVICE_ID_FHIR_IDENTIFIER):
        params = self.query_params.get('identifier', [])
        params.append(f"{fhir_code}|{service_id}")
        self.query_params['identifier'] = params
        return self

    def with_party_key(self, party_key: str, fhir_code=PARTY_KEY_FHIR_IDENTIFIER):
        params = self.query_params.get('identifier', [])
        params.append(f"{fhir_code}|{party_key}")
        self.query_params['identifier'] = params
        return self

    def with_manufacturing_organization(self, manufacturing_organization: str, fhir_code=MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER):
        params = self.query_params.get('manufacturing-organization', [])
        params.append(f"{fhir_code}|{manufacturing_organization}")
        self.query_params['manufacturing-organization'] = params
        return self

    def with_correlation_id(self, correlation_id: str):
        self.headers["X-Correlation-ID"] = correlation_id
        return self

    def execute(self) -> Response:
        return self._execute_request()

    def execute_get_expecting_success(self) -> Response:
        response = self._execute_request()
        self.assertions.assertTrue(
            response.ok,
            f'A non successful error code was returned from server: {response.status_code} {response.text}')

        return response

    def execute_get_expecting_error_response(self) -> Response:
        response = self._execute_request()
        self.assertions.assertTrue(
            response.status_code == 500,
            f'A non 500 error code was returned from server: {response.status_code} {response.text}')

        return response

    def execute_get_expecting_bad_request_response(self) -> Response:
        response = self._execute_request()
        self.assertions.assertTrue(
            response.status_code == 400,
            f'A non 400 error code was returned from server: {response.status_code} {response.text}')

        return response

    def _execute_request(self) -> Response:
        request_action = requests.get
        if self.method == "GET":
            request_action = requests.get
        elif self.method == "POST":
            request_action = requests.post
        return request_action(self.sds_host + self.path, params=self.query_params, headers=self.headers, verify=False, timeout=15)
