import json
import unittest.mock
import uuid
from abc import ABC
from typing import Optional

import tornado.testing
import tornado.web

from request import routing_reliability_handler, accredited_system_handler
from request.http_headers import HttpHeaders
from utilities import message_utilities

ORG_CODE = "org"
SPINE_CORE_ORG_CODE = "core_org"
SERVICE_ID = "service:interaction"
FORWARD_RELIABLE_SERVICE_ID = "urn:nhs:names:services:gp2gp:RCMR_IN010000UK05"
CORE_SPINE_FORWARD_RELIABLE_SERVICE_ID = "urn:nhs:names:services:tms:ReliableIntermediary"
PARTY_KEY = "some_party_key"
MANUFACTURING_ORG = "some_manufacturer"
FIXED_UUID = "f0f0e921-92ca-4a88-a550-2dbb36f703af"

DEVICE_PATH = "/device"


class RequestHandlerTestBase(ABC, tornado.testing.AsyncHTTPTestCase):

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.maxDiff = None

    def get_app(self):
        self.sds_client = unittest.mock.Mock()

        return tornado.web.Application([
            (r"/endpoint", routing_reliability_handler.RoutingReliabilityRequestHandler, {"sds_client": self.sds_client}),
            (r"/device", accredited_system_handler.AccreditedSystemRequestHandler, {"sds_client": self.sds_client})
        ])

    def _test_get(self, url, expected_json_file_path):
        response = self.fetch(url, method="GET")

        current, expected = self._get_current_and_expected_body(response, expected_json_file_path)

        self.assertEqual(response.code, 200)
        self.assertEqual(expected, current)
        self.assertEqual(response.headers.get(HttpHeaders.CONTENT_TYPE, None), "application/fhir+json")
        self.assertIsNotNone(response.headers.get(HttpHeaders.X_CORRELATION_ID, None))

    def _test_correlation_id_is_set_as_response_header(self, url, invalid_url, mock_200, mock_500):
        with self.subTest("X-Correlation-ID is set on 200 response"):
            correlation_id = str(uuid.uuid4()).upper()
            mock_200()
            response = self.fetch(url, method="GET", headers={'X-Correlation-ID': correlation_id})
            self.assertEqual(response.code, 200)
            self.assertEqual(response.headers.get('X-Correlation-ID'), correlation_id)

        with self.subTest("X-Correlation-ID is set on 500 response"):
            correlation_id = str(uuid.uuid4()).upper()
            mock_500()
            response = self.fetch(url, method="GET", headers={'X-Correlation-ID': correlation_id})
            self.assertEqual(response.code, 500)
            self.assertEqual(response.headers.get('X-Correlation-ID'), correlation_id)

        with self.subTest("X-Correlation-ID is set on 400 response"):
            correlation_id = str(uuid.uuid4()).upper()
            response = self.fetch(
                invalid_url, method="GET", headers={'X-Correlation-ID': correlation_id})
            self.assertEqual(response.code, 400)
            self.assertEqual(response.headers.get('X-Correlation-ID'), correlation_id)

    def _test_get_handles_different_accept_header(self, url, expected_json_file_path):
        with self.subTest("Accept header is missing"):
            response = self.fetch(url, method="GET")

            current, expected = self._get_current_and_expected_body(response, expected_json_file_path)

            self.assertEqual(response.code, 200)
            self.assertEqual(expected, current)
            self.assertEqual(response.headers.get(HttpHeaders.CONTENT_TYPE, None), "application/fhir+json")

        with self.subTest("Accept header is case-insensitive application/fhir+json"):
            headers = {'Accept': 'application/fhir+JSON'}
            response = self.fetch(url, method="GET", headers=headers)

            current, expected = self._get_current_and_expected_body(response, expected_json_file_path)

            self.assertEqual(response.code, 200)
            self.assertEqual(expected, current)
            self.assertEqual(response.headers.get(HttpHeaders.CONTENT_TYPE, None), "application/fhir+json")

        with self.subTest("Accept header can have multiple values and one must be valid"):
            headers = {'Accept': ',  ,  text/plain , application/fhir+JSON'}
            response = self.fetch(url, method="GET", headers=headers)

            current, expected = self._get_current_and_expected_body(response, expected_json_file_path)

            self.assertEqual(response.code, 200)
            self.assertEqual(expected, current)
            self.assertEqual(response.headers.get(HttpHeaders.CONTENT_TYPE, None), "application/fhir+json")

        with self.subTest("Accept header is invalid"):
            headers = {'Accept': 'text/plain,application/xml'}
            response = self.fetch(url, method="GET", headers=headers)

            self.assertEqual(response.code, 406)

    def _test_should_return_405_when_using_non_get(self, url: str):
        for method in ["POST", "DELETE", "PUT", "OPTIONS"]:
            with self.subTest(f"405 when using {method}"):
                response = self.fetch(url, body="" if method in ["POST", "PUT"] else None, method=method)
                self.assertEqual(response.code, 405)
                self.assertEqual(response.headers.get("Allow"), "GET")
                self._assert_405_operation_outcome(response.body.decode())

    @staticmethod
    def _build_endpoint_url(org_code: Optional[str] = ORG_CODE, service_id: Optional[str] = SERVICE_ID, party_key: Optional[str] = PARTY_KEY):
        url = "/endpoint"

        org_code = f"organization=https://fhir.nhs.uk/Id/ods-organization-code|{org_code}" if org_code is not None else None
        service_id = f"identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|{service_id}" if service_id is not None else None
        party_key = f"identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|{party_key}" if party_key is not None else None
        query_params = "&".join(filter(lambda query_param: query_param, [org_code, service_id, party_key]))

        url = f"{url}?{query_params}" if query_params else url
        return url

    @staticmethod
    def _build_device_url(
            org_code: Optional[str] = ORG_CODE,
            service_id: Optional[str] = SERVICE_ID,
            party_key: Optional[str] = PARTY_KEY,
            manufacturing_organization: Optional[str] = MANUFACTURING_ORG):

        path = DEVICE_PATH

        org_code = f"organization=https://fhir.nhs.uk/Id/ods-organization-code|{org_code}" if org_code is not None else None
        service_id = f"identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|{service_id}" if service_id is not None else None
        party_key = f"identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|{party_key}" if party_key is not None else None
        manufacturing_organization = f"manufacturing-organization=https://fhir.nhs.uk/Id/ods-organization-code|{manufacturing_organization}" if manufacturing_organization is not None else None

        query_params = "&".join(filter(lambda query_param: query_param, [org_code, service_id, party_key, manufacturing_organization]))

        path = f"{path}?{query_params}" if query_params else path
        return path

    def _get_current_and_expected_body(self, response, expected_file_path):
        current = json.loads(message_utilities.replace_uuid(response.body.decode(), FIXED_UUID))

        self.assertEqual(current["resourceType"], "Bundle", current)

        current_entries = current["entry"]
        current_id = current['id']
        current_link_url = current['link'][0]['url']

        expected = json.loads(open(expected_file_path, "r").read())
        expected_entries = expected["entry"]
        expected['id'] = current_id
        expected['link'][0]['url'] = current_link_url

        self.assertEqual(len(current_entries), len(expected_entries))

        for i in range(0, len(current_entries)):
            current_entry = current_entries[i]
            current_entry_full_url = current_entry["fullUrl"]
            current_resource_id = current_entry["resource"]["id"]
            expected_entry = expected_entries[i]
            expected_entry["fullUrl"] = current_entry_full_url
            expected_entry["resource"]["id"] = current_resource_id

        return current, expected

    def _assert_400_operation_outcome(self, response_content, diagnostics):
        operation_outcome = json.loads(response_content)
        self.assertEqual(operation_outcome["resourceType"], "OperationOutcome")
        issue = operation_outcome["issue"][0]
        self.assertEqual(issue["severity"], "error")
        self.assertEqual(issue["code"], "required")
        self.assertEqual(issue["diagnostics"], diagnostics)
        coding = issue["details"]["coding"][0]
        self.assertEqual(coding["system"], 'https://fhir.nhs.uk/STU3/ValueSet/Spine-ErrorOrWarningCode-1')
        self.assertEqual(coding["code"], 'BAD_REQUEST')
        self.assertEqual(coding["display"], 'Bad request')

    def _assert_405_operation_outcome(self, response_content):
        operation_outcome = json.loads(response_content)
        self.assertEqual(operation_outcome["resourceType"], "OperationOutcome")
        issue = operation_outcome["issue"][0]
        self.assertEqual(issue["severity"], "error")
        self.assertEqual(issue["code"], "not-supported")
        self.assertEqual(issue["diagnostics"], 'HTTP operation not supported')
        coding = issue["details"]["coding"][0]
        self.assertEqual(coding["system"], 'https://fhir.nhs.uk/STU3/ValueSet/Spine-ErrorOrWarningCode-1')
        self.assertEqual(coding["code"], 'NOT_IMPLEMENTED')
        self.assertEqual(coding["display"], 'Not implemented')

    def _assert_500_operation_outcome(self, response_content):
        operation_outcome = json.loads(response_content)
        self.assertEqual(operation_outcome["resourceType"], "OperationOutcome")
        issue = operation_outcome["issue"][0]
        self.assertEqual(issue["severity"], "error")
        self.assertEqual(issue["code"], "exception")
        self.assertEqual(issue["diagnostics"], 'some error')
        coding = issue["details"]["coding"][0]
        self.assertEqual(coding["system"], 'https://fhir.nhs.uk/STU3/ValueSet/Spine-ErrorOrWarningCode-1')
        self.assertEqual(coding["code"], 'INTERNAL_SERVER_ERROR')
        self.assertEqual(coding["display"], 'Unexpected internal server error')
