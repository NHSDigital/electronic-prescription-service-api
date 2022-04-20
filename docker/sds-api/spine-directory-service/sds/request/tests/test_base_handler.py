from typing import List
from unittest import TestCase
from unittest.mock import MagicMock

import tornado

from request.base_handler import BaseHandler


SUPPORTED_IDENTIFIERS = {"fhir1", "fhir2"}


class TestBaseHandler(TestCase):

    def setUp(self) -> None:
        super().setUp()
        self.base_handler = BaseHandler(MagicMock(), MagicMock(), sds_client=MagicMock())

    @staticmethod
    def build_get_query_arguments_mock(expected_parameter, expected_value: List[str]):
        def get_query_arguments_mock(query_parameter):
            if expected_parameter == query_parameter:
                return expected_value
            return None
        return get_query_arguments_mock

    def test_should_return_required_query_parameter(self):
        values = [
            (["fhir1|qwe"], "qwe"),
            (["fhir1||asd|zxc"], "|asd|zxc"),
        ]

        for query_params, expected_result in values:
            with self.subTest(f"Valid query parameters {query_params} returns expected result {expected_result}"):
                self.base_handler.get_query_arguments = \
                    TestBaseHandler.build_get_query_arguments_mock("identifier", query_params)
                value = self.base_handler.get_required_query_param("identifier", "fhir1")
                self.assertEqual(value, expected_result)

    def test_should_raise_error_when_required_query_parameter_is_missing(self):
        values = [
            [],
            ["|"],
            ["fhir1|"],
            ["fhir1| "]
        ]

        for query_params in values:
            with self.subTest(f"Valid query parameters {query_params} returns raises error"):
                self.base_handler.get_query_arguments = \
                    TestBaseHandler.build_get_query_arguments_mock("identifier", query_params)
                self.assertRaises(
                    tornado.web.HTTPError,
                    self.base_handler.get_required_query_param, "identifier", "fhir1")
