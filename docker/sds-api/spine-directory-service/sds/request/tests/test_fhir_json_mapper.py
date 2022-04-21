import itertools
import json
import os
from unittest import TestCase
from unittest.mock import patch

from request.fhir_json_mapper import build_endpoint_resources, build_device_resource


class TestGetJsonFormat(TestCase):

    @staticmethod
    def _read_file(file):
        with open(file, 'r') as f:
            return json.load(f)

    @patch('request.fhir_json_mapper.message_utilities')
    def test_build_resources_from_ldap_results(self, message_utilities_mock):
        resource_test_cases = [
            ('endpoint', build_endpoint_resources),
            ('device', build_device_resource)
        ]
        for resource, tested_method in resource_test_cases:
            dir_path = os.path.join(
                os.path.dirname(os.path.realpath(__file__)),
                os.path.join("test_data", "fhir_json_mapper", resource))

            test_cases = set(map(lambda x: x.split('.')[0], os.listdir(dir_path)))

            for test_case in test_cases:
                message_utilities_mock.get_uuid.side_effect = itertools.count().__next__
                ldap_attributes = self._read_file(os.path.join(dir_path, f'{test_case}.in.json'))
                expected_result = self._read_file(os.path.join(dir_path, f'{test_case}.out.json'))

                with self.subTest(f'{resource} : {test_case}'):
                    result = tested_method(ldap_attributes)
                    self.assertEqual(result, expected_result)
