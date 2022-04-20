from os import path
from unittest.mock import patch, call

from request.tests.request_handler_test_base import RequestHandlerTestBase, ORG_CODE, SERVICE_ID, PARTY_KEY, \
    SPINE_CORE_ORG_CODE, FORWARD_RELIABLE_SERVICE_ID, CORE_SPINE_FORWARD_RELIABLE_SERVICE_ID
from utilities import test_utilities

EXPECTED_SINGLE_ENDPOINT_JSON_FILE_PATH = path.join(path.dirname(__file__), "examples/single_endpoint.json")
EXPECTED_MULTIPLE_ENDPOINTS_JSON_FILE_PATH = path.join(path.dirname(__file__), "examples/multiple_endpoints.json")
EXPECTED_FORWARD_RELIABLE_ENDPOINTS_JSON_FILE_PATH = path.join(path.dirname(__file__), "examples/multiple_endpoints_with_forward_reliable.json")
SINGLE_ROUTING_AND_RELIABILITY_DETAILS = [{
    "nhsMHSEndPoint": [
        "https://192.168.128.11/sync-service"
    ],
    "nhsMHSPartyKey": PARTY_KEY,
    "nhsMhsCPAId": "S20001A000168",
    "nhsMhsFQDN": "192.168.128.11",
    "uniqueIdentifier": [
        "928942012545"
    ],
    "nhsMHSAckRequested": "never",
    "nhsMHSDuplicateElimination": "never",
    "nhsMHSPersistDuration": "",
    "nhsMHSRetries": "",
    "nhsMHSRetryInterval": "",
    "nhsMHSSyncReplyMode": "",
    "nhsMhsSvcIA": SERVICE_ID,
    "nhsIDCode": ORG_CODE
}]

MULTIPLE_ROUTING_AND_RELIABILITY_DETAILS = SINGLE_ROUTING_AND_RELIABILITY_DETAILS.copy()
MULTIPLE_ROUTING_AND_RELIABILITY_DETAILS.append({
    "nhsMHSEndPoint": [
        "https://192.168.128.11/sync-service_second",
        "https://192.168.128.11/sync-service_third"
    ],
    "nhsMHSPartyKey": PARTY_KEY,
    "nhsMhsCPAId": "S20001A000168_second",
    "nhsMhsFQDN": "192.168.128.11_second",
    "uniqueIdentifier": [
        "928942012545_second"
    ],
    "nhsMHSAckRequested": "never",
    "nhsMHSDuplicateElimination": "never",
    "nhsMHSPersistDuration": "",
    "nhsMHSRetries": "",
    "nhsMHSRetryInterval": "",
    "nhsMHSSyncReplyMode": "",
    "nhsMhsSvcIA": SERVICE_ID,
    "nhsIDCode": ORG_CODE
})

FORWARD_RELIABLE_ROUTING_AND_RELIABILITY_DETAILS = [{
    "nhsMHSEndPoint": [
        "http:/appreliablemessaging"
    ],
    "nhsMhsSvcIA": CORE_SPINE_FORWARD_RELIABLE_SERVICE_ID,
    "nhsIDCode": SPINE_CORE_ORG_CODE
}]


class TestRoutingReliabilityRequestHandler(RequestHandlerTestBase):

    @patch('utilities.config.get_config')
    def test_get_single(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        self.sds_client.get_mhs_details.return_value = test_utilities.awaitable(SINGLE_ROUTING_AND_RELIABILITY_DETAILS)

        super()._test_get(super()._build_endpoint_url(), EXPECTED_SINGLE_ENDPOINT_JSON_FILE_PATH)

        self.sds_client.get_mhs_details.assert_called_with(ORG_CODE, SERVICE_ID, PARTY_KEY)

    @patch('utilities.config.get_config')
    def test_get_multiple(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        self.sds_client.get_mhs_details.return_value = test_utilities.awaitable(MULTIPLE_ROUTING_AND_RELIABILITY_DETAILS)

        super()._test_get(super()._build_endpoint_url(), EXPECTED_MULTIPLE_ENDPOINTS_JSON_FILE_PATH)

        self.sds_client.get_mhs_details.assert_called_with(ORG_CODE, SERVICE_ID, PARTY_KEY)

    @patch('utilities.config.get_config')
    def test_get_multiple_with_forward_reliable_service(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        routing_and_reliability_details = MULTIPLE_ROUTING_AND_RELIABILITY_DETAILS.copy()
        routing_and_reliability_details[1]["nhsMhsSvcIA"] = FORWARD_RELIABLE_SERVICE_ID

        self.sds_client.get_mhs_details.side_effect = [
            test_utilities.awaitable(routing_and_reliability_details),
            test_utilities.awaitable(FORWARD_RELIABLE_ROUTING_AND_RELIABILITY_DETAILS),
            ]

        super()._test_get(super()._build_endpoint_url(service_id=FORWARD_RELIABLE_SERVICE_ID), EXPECTED_FORWARD_RELIABLE_ENDPOINTS_JSON_FILE_PATH)

        self.sds_client.get_mhs_details.assert_has_calls([
            call(ORG_CODE, FORWARD_RELIABLE_SERVICE_ID, PARTY_KEY),
            call(SPINE_CORE_ORG_CODE, CORE_SPINE_FORWARD_RELIABLE_SERVICE_ID)
        ])

    @patch('utilities.config.get_config')
    def test_supported_query_params(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        self.sds_client.get_mhs_details.return_value = test_utilities.awaitable(SINGLE_ROUTING_AND_RELIABILITY_DETAILS)

        for org_code, service_id, party_key in [
            (ORG_CODE, SERVICE_ID, PARTY_KEY),
            (ORG_CODE, SERVICE_ID, None),
            (ORG_CODE, None, PARTY_KEY),
            (None, SERVICE_ID, PARTY_KEY),
        ]:
            with self.subTest(f"Endpoint valid query params: org_code={org_code} service_id={service_id} party_key={party_key}"):
                endpoint_url = super()._build_endpoint_url(org_code=org_code, service_id=service_id, party_key=party_key)
                super()._test_get(endpoint_url, EXPECTED_SINGLE_ENDPOINT_JSON_FILE_PATH)
                self.sds_client.get_mhs_details.assert_called_with(org_code, service_id, party_key)

    @patch('utilities.config.get_config')
    def test_correlation_id_is_set_as_response_header(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        def mock200():
            self.sds_client.get_mhs_details.return_value = test_utilities.awaitable(SINGLE_ROUTING_AND_RELIABILITY_DETAILS)

        def mock500():
            self.sds_client.get_mhs_details.side_effect = Exception

        super()._test_correlation_id_is_set_as_response_header(
            self._build_endpoint_url(),
            self._build_endpoint_url(org_code=None, service_id=None, party_key=None),
            mock200,
            mock500
        )

    def test_get_returns_error(self):
        with self.subTest("Lookup error"):
            self.sds_client.get_mhs_details.side_effect = Exception("some error")
            response = self.fetch(self._build_endpoint_url(), method="GET")
            self.assertEqual(response.code, 500)
            super()._assert_500_operation_outcome(response.body.decode())

    def test_get_handles_missing_params(self):
        error_message = "HTTP 400: Bad Request (Missing or invalid query parameters. Should one of following combinations: ['organization=https://fhir.nhs.uk/Id/ods-organization-code|value&identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value&identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|value''organization=https://fhir.nhs.uk/Id/ods-organization-code|value&identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value''organization=https://fhir.nhs.uk/Id/ods-organization-code|value&identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|value''identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value&identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|value'])"

        with self.subTest("Missing Org Code but Service Id is present"):
            response = self.fetch(self._build_endpoint_url(org_code=None, service_id=SERVICE_ID, party_key=None), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(response.body.decode(), error_message)

        with self.subTest("Missing Org Code but Party Key is present"):
            response = self.fetch(self._build_endpoint_url(org_code=None, service_id=None, party_key=PARTY_KEY), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(response.body.decode(), error_message)

        with self.subTest("Missing Service ID and party key"):
            response = self.fetch(self._build_endpoint_url(org_code=ORG_CODE, service_id=None, party_key=None), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(response.body.decode(), error_message)

    @patch('utilities.config.get_config')
    def test_get_handles_different_accept_header(self, mock_config):
        self._set_core_spine_ods_code(mock_config, SPINE_CORE_ORG_CODE)

        self.sds_client.get_mhs_details.return_value = test_utilities.awaitable(SINGLE_ROUTING_AND_RELIABILITY_DETAILS)
        super()._test_get_handles_different_accept_header(
            super()._build_endpoint_url(),
            EXPECTED_SINGLE_ENDPOINT_JSON_FILE_PATH)

    def test_should_return_405_when_using_non_get(self):
        super()._test_should_return_405_when_using_non_get(super()._build_endpoint_url())

    @staticmethod
    def _set_core_spine_ods_code(mock_config, ods_code):
        def config_values(*args, **kwargs):
            return {
                "SPINE_CORE_ODS_CODE": ods_code
            }[args[0]]
        mock_config.side_effect = config_values
