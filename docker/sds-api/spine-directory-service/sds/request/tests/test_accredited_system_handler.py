from os import path
from request.tests.request_handler_test_base import RequestHandlerTestBase, ORG_CODE, SERVICE_ID, PARTY_KEY, MANUFACTURING_ORG
from utilities import test_utilities

EXPECTED_SINGLE_DEVICE_JSON_FILE_PATH = path.join(path.dirname(__file__), "examples/single_device.json")
EXPECTED_MULTIPLE_DEVICES_JSON_FILE_PATH = path.join(path.dirname(__file__), "examples/multiple_devices.json")
SINGLE_ACCREDITED_SYSTEM_DETAILS = [{
    "nhsMhsManufacturerOrg": MANUFACTURING_ORG,
    "uniqueIdentifier": [
        "928942012545"
    ],
    "nhsMhsPartyKey": PARTY_KEY,
    "nhsAsSvcIA": [SERVICE_ID],
    "nhsAsClient": [ORG_CODE]
}]

MULTIPLE_ACCREDITED_SYSTEM_DETAILS = SINGLE_ACCREDITED_SYSTEM_DETAILS.copy()
MULTIPLE_ACCREDITED_SYSTEM_DETAILS.append({
    "nhsMhsManufacturerOrg": MANUFACTURING_ORG + "_second",
    "uniqueIdentifier": [
        "928942012545_second"
    ],
    "nhsMhsPartyKey": PARTY_KEY + "_second",
    "nhsAsSvcIA": [SERVICE_ID],
    "nhsAsClient": [ORG_CODE]
})


class TestAccreditedSystemHandler(RequestHandlerTestBase):

    def test_get_single_result(self):
        self.sds_client.get_as_details.return_value = test_utilities.awaitable(SINGLE_ACCREDITED_SYSTEM_DETAILS)

        super()._test_get(
            super()._build_device_url(party_key=None, manufacturing_organization=None),
            EXPECTED_SINGLE_DEVICE_JSON_FILE_PATH)

        self.sds_client.get_as_details.assert_called_with(ORG_CODE, SERVICE_ID, None, None)

    def test_get_multiple_results(self):
        self.sds_client.get_as_details.return_value = test_utilities.awaitable(MULTIPLE_ACCREDITED_SYSTEM_DETAILS)

        super()._test_get(
            super()._build_device_url(party_key=None, manufacturing_organization=None),
            EXPECTED_MULTIPLE_DEVICES_JSON_FILE_PATH)

        self.sds_client.get_as_details.assert_called_with(ORG_CODE, SERVICE_ID, None, None)

    def test_correlation_id_is_set_as_response_header(self):
        def mock200():
            self.sds_client.get_as_details.return_value = test_utilities.awaitable(SINGLE_ACCREDITED_SYSTEM_DETAILS)

        def mock500():
            self.sds_client.get_as_details.side_effect = Exception

        super()._test_correlation_id_is_set_as_response_header(
            self._build_device_url(),
            self._build_device_url(org_code=None),
            mock200,
            mock500
        )

    def test_get_returns_error(self):
        with self.subTest("Lookup error"):
            self.sds_client.get_as_details.side_effect = Exception("some error")
            response = self.fetch(self._build_device_url(), method="GET")
            self.assertEqual(response.code, 500)
            super()._assert_500_operation_outcome(response.body.decode())

    def test_get_handles_missing_params(self):
        with self.subTest("Missing Org Code"):
            response = self.fetch(self._build_device_url(org_code=None, service_id=SERVICE_ID), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(
                response.body.decode(),
                "HTTP 400: Bad Request (Missing or invalid 'organization' query parameter. Should be 'organization=https://fhir.nhs.uk/Id/ods-organization-code|value')")

        with self.subTest("Empty Org Code"):
            response = self.fetch(self._build_device_url(org_code='', service_id=SERVICE_ID), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(
                response.body.decode(),
                "HTTP 400: Bad Request (Missing or invalid 'organization' query parameter. Should be 'organization=https://fhir.nhs.uk/Id/ods-organization-code|value')")

        with self.subTest("Missing Service ID"):
            response = self.fetch(self._build_device_url(org_code=ORG_CODE, service_id=None), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(
                response.body.decode(),
                "HTTP 400: Bad Request (Missing or invalid 'identifier' query parameter. Should be 'identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value')")

        with self.subTest("Empty Service ID"):
            response = self.fetch(self._build_device_url(org_code=ORG_CODE, service_id=''), method="GET")
            self.assertEqual(response.code, 400)
            super()._assert_400_operation_outcome(
                response.body.decode(),
                "HTTP 400: Bad Request (Missing or invalid 'identifier' query parameter. Should be 'identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value')")

        for value in ['', 'fhir', 'fhir|', f'fhir|value']:
            with self.subTest(f"Invalid optional identifier with value '{value}'"):
                base_url = self._build_device_url(org_code=ORG_CODE, service_id=SERVICE_ID)
                url = f"{base_url}&identifier={value}"
                response = self.fetch(url, method="GET")
                self.assertEqual(response.code, 400)
                super()._assert_400_operation_outcome(
                    response.body.decode(),
                    f"HTTP 400: Bad Request (Missing or invalid 'identifier' query parameter. Should be one or both of: ['identifier=https://fhir.nhs.uk/Id/nhsServiceInteractionId|value', 'identifier=https://fhir.nhs.uk/Id/nhsMhsPartyKey|value')")

        for value in ['', 'fhir', 'fhir|', f'fhir|value']:
            with self.subTest(f"Invalid manufacturing-organization with value '{value}'"):
                base_url = self._build_device_url(org_code=ORG_CODE, service_id=SERVICE_ID)
                url = f"{base_url}&manufacturing-organization={value}"
                response = self.fetch(url, method="GET")
                self.assertEqual(response.code, 400)
                super()._assert_400_operation_outcome(
                    response.body.decode(),
                    f"HTTP 400: Bad Request (Missing or invalid 'manufacturing-organization' query parameter. Should be 'manufacturing-organization=https://fhir.nhs.uk/Id/ods-organization-code|value')")

    def test_get_handles_different_accept_header(self):
        self.sds_client.get_as_details.return_value = test_utilities.awaitable(SINGLE_ACCREDITED_SYSTEM_DETAILS)
        super()._test_get_handles_different_accept_header(
            super()._build_device_url(), EXPECTED_SINGLE_DEVICE_JSON_FILE_PATH)

    def test_should_return_405_when_using_non_get(self):
        super()._test_should_return_405_when_using_non_get(super()._build_device_url())
