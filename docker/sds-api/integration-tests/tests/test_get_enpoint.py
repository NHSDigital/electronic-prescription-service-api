import json
import re
from unittest import TestCase

from utilities.SdsHttpRequestBuilder import SdsHttpRequestBuilder
from utilities.TestUtils import read_test_data_json, assert_404_operation_outcome


class RoutingAndReliabilityHandlerTests(TestCase):

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.maxDiff = None

    @staticmethod
    def _sds_device_http_request_builder():
        return SdsHttpRequestBuilder("/Endpoint")

    def test_should_return_successful_response(self):
        response = self._sds_device_http_request_builder() \
            .with_org_code('YES') \
            .with_service_id('urn:nhs:names:services:psis:REPC_IN150016UK05') \
            .with_party_key('YES-0000806') \
            .execute_get_expecting_success()

        self._assert_response(response, "endpoint.json")

    def test_should_return_forward_reliable_address(self):
        response = self._sds_device_http_request_builder() \
            .with_org_code('X26') \
            .with_service_id('urn:nhs:names:services:gp2gp:COPC_IN000001UK01') \
            .with_party_key('X26-820918') \
            .execute_get_expecting_success()

        self._assert_response(response, "endpoint_forward_reliable.json")

    def test_should_return_forward_express_address(self):
        response = self._sds_device_http_request_builder() \
            .with_org_code('X26') \
            .with_service_id('urn:nhs:names:services:ebs:PRSC_IN080000UK03') \
            .with_party_key('X26-200150') \
            .execute_get_expecting_success()

        self._assert_response(response, "endpoint_forward_express.json")

    def _assert_response(self, response, expected_response_json_file_name: str):
        self.assertEqual('application/fhir+json', response.headers['Content-Type'])

        body = json.loads(response.content.decode('UTF-8'))

        self.assertEqual(body['resourceType'], 'Bundle')
        self.assertNotEqual(body['total'], '0')

        # id is generated so we first check if existing one is an UUID
        # and then we use it in the expected json
        current_id = body['id']
        current_link_url = body['link'][0]['url']
        current_entry_full_url = body["entry"][0]["fullUrl"]
        current_resource_id = body["entry"][0]["resource"]["id"]

        uuidRegex = re.compile('^[A-F0-9]{8}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{12}')
        self.assertTrue(bool(uuidRegex.match(current_id)))
        self.assertTrue(bool(uuidRegex.match(current_resource_id)))
        fullUrlRegex = re.compile('^(http:\/\/localhost:9000\/Endpoint\/)([A-F0-9]{8}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{4}-?[A-F0-9]{12})')
        self.assertTrue(bool(fullUrlRegex.match(current_entry_full_url)))

        expected_body = read_test_data_json(expected_response_json_file_name)
        expected_body['id'] = current_id
        expected_body["entry"][0]["fullUrl"] = current_entry_full_url
        expected_body["entry"][0]["resource"]["id"] = current_resource_id
        expected_body['link'][0]['url'] = current_link_url

        self.assertEqual(expected_body, body)

    def test_should_return_successful_response_when_there_are_no_results(self):
        response = self._sds_device_http_request_builder()\
            .with_org_code('YES') \
            .with_service_id('non-existing') \
            .execute_get_expecting_success()

        self.assertEqual('application/fhir+json', response.headers['Content-Type'])

        body = json.loads(response.content.decode('UTF-8'))

        self.assertEqual(body["total"], 0)
        self.assertEqual(len(body["entry"]), 0)

    def test_should_return_404_when_calling_invalid_endpoint(self):
        response = self._sds_device_http_request_builder() \
            .with_path("/something") \
            .with_org_code('YES') \
            .with_service_id('urn:nhs:names:services:psis:REPC_IN150016UK05') \
            .execute()

        self.assertEqual(response.status_code, 404)
        assert_404_operation_outcome(response.content)

    def test_endpoint_should_be_case_sensitive(self):
        builder = self._sds_device_http_request_builder()
        builder.path = builder.path.lower()

        response = builder \
            .with_org_code('YES') \
            .with_service_id('urn:nhs:names:services:psis:REPC_IN150016UK05') \
            .execute()

        self.assertEqual(response.status_code, 404)
        assert_404_operation_outcome(response.content)
