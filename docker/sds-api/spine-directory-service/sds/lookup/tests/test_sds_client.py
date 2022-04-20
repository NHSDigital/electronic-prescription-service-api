from copy import copy
from unittest import TestCase

from utilities.test_utilities import async_test

import lookup.sds_client as sds_client
import lookup.tests.ldap_mocks as mocks

MHS_OBJECT_CLASS = "nhsMhs"

PARTY_KEY = "AP4RTY-K33Y"
INTERACTION_ID = "urn:nhs:names:services:psis:MCCI_IN010000UK13"
ODS_CODE = "ODSCODE1"

AS_INTERACTION_ID = "urn:nhs:names:services:psis:REPC_IN150016UK05"

expected_mhs_attributes = [{
    'nhsIDCode': 'ODSCODE1',
    'nhsMHSAckRequested': 'always',
    'nhsMHSDuplicateElimination': 'always',
    'nhsMHSEndPoint': ['https://vpn-client-1411.opentest.hscic.gov.uk/'],
    'nhsMHSPartyKey': 'AP4RTY-K33Y',
    'nhsMHSPersistDuration': 'PT5M',
    'nhsMHSRetries': '2',
    'nhsMHSRetryInterval': 'PT1M',
    'nhsMHSSyncReplyMode': 'MSHSignalsOnly',
    'nhsMHsIN': 'MCCI_IN010000UK13',
    'nhsMHsSN': 'urn:nhs:names:services:psis',
    'nhsMhsCPAId': 'S918999410559',
    'nhsMhsFQDN': 'vpn-client-1411.opentest.hscic.gov.uk',
    'nhsMhsSvcIA': 'urn:nhs:names:services:psis:MCCI_IN010000UK13',
    'uniqueIdentifier': ['S918999410559'],
}]

EXPECTED_DEVICE_ATTRIBUTES = [
    {
        "nhsAsClient": [
            "ODSCODE1"
        ],
        "nhsAsSvcIA": [
            "urn:nhs:names:services:psis:REPC_IN150016UK05"
        ],
        "nhsIDCode": "ODSCODE1",
        "nhsMHSPartyKey": "AP4RTY-K33Y",
        "uniqueIdentifier": [
            "123456789"
        ]
    }
]


class TestSDSClient(TestCase):

    @async_test
    async def test_get_mhs_details(self):
        client = mocks.mocked_sds_client()

        attributes = await client.get_mhs_details(ODS_CODE, INTERACTION_ID)
        expected = [copy(expected_mhs_attributes[0])]
        # check values present
        for key, value in expected[0].items():
            self.assertEqual(value, attributes[0][key])

        # Assert exact number of attributes, minus the unique values
        self.assertEqual(len(attributes), len(expected_mhs_attributes))

    @async_test
    async def test_get_as_details(self):
        client = mocks.mocked_sds_client()

        attributes = await client.get_as_details(ODS_CODE, AS_INTERACTION_ID, manufacturing_organization=None, party_key=PARTY_KEY)
        expected = [copy(EXPECTED_DEVICE_ATTRIBUTES[0])]
        # check values present
        for key, value in expected[0].items():
            self.assertEqual(value, attributes[0][key])

        # Assert exact number of attributes, minus the unique values
        self.assertEqual(len(attributes), len(EXPECTED_DEVICE_ATTRIBUTES))

    @async_test
    async def test_no_results(self):
        client = mocks.mocked_sds_client()
        attributes = await client.get_mhs_details("fake code", "fake interaction")
        self.assertEqual(attributes, [])

        attributes = await client.get_as_details("fake code", "fake interaction", None, "fake_party_key")
        # TODO: can't use atm with Opentest as it lacks required schema attribute
        # attributes = await client.get_as_details("fake code", "fake interaction", "fake manufacturer", "fake_party_key")
        self.assertEqual(attributes, [])

    @async_test
    async def test_should_raise_error_if_no_connection_set(self):
        with self.assertRaises(ValueError):
            sds_client.SDSClient(None, "ou=search,o=base")

    @async_test
    async def test_should_raise_error_if_no_search_base_set(self):
        with self.assertRaises(ValueError):
            sds_client.SDSClient(mocks.fake_ldap_connection(), None)
