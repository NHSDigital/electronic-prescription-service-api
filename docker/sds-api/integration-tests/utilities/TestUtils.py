import json
import os
import unittest

TEST_DATA_BASE_PATH = os.path.join(os.path.dirname(__file__), '../tests/test_data/')

assertions = unittest.TestCase('__init__')


def read_test_data_json(file):
    with open(os.path.join(TEST_DATA_BASE_PATH, file)) as json_file:
        return json.load(json_file)


def assert_404_operation_outcome(response_content):
    operation_outcome = json.loads(response_content)
    assertions.assertEqual(operation_outcome["resourceType"], "OperationOutcome")
    issue = operation_outcome["issue"][0]
    assertions.assertEqual(issue["severity"], "error")
    assertions.assertEqual(issue["code"], "not-found")
    assertions.assertEqual(issue["diagnostics"], 'HTTP endpoint not found')
    coding = issue["details"]["coding"][0]
    assertions.assertEqual(coding["system"], 'https://fhir.nhs.uk/STU3/ValueSet/Spine-ErrorOrWarningCode-1')
    assertions.assertEqual(coding["code"], 'NO_RECORD_FOUND')
    assertions.assertEqual(coding["display"], 'No record found')
