from unittest import TestCase

import tornado.testing
import tornado.web
from tornado.httputil import HTTPHeaders

from request.tracking_ids_headers_reader import read_tracking_id_headers
from utilities import mdc

CORRELATION_ID_HEADER = "X-Correlation-ID"
FIXED_UUID_LOWER_CASE = "f0f0e921-92ca-4a88-a550-2dbb36f703af"
FIXED_UUID_UPPER_CASE = "B23EE5C7-126F-401B-9BFA-A0D36F72119E"
UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"


class TestGetJsonFormat(TestCase):

    def setUp(self) -> None:
        mdc.correlation_id.set('')

    def test_read_valid_correlation_id(self):
        with self.subTest("Lower case UUID"):
            headers = HTTPHeaders()
            headers.add(CORRELATION_ID_HEADER, FIXED_UUID_LOWER_CASE)
            read_tracking_id_headers(headers)
            self.assertEqual(mdc.correlation_id.get(), FIXED_UUID_LOWER_CASE)

        mdc.correlation_id.set('')

        with self.subTest("Upper case UUID"):
            headers = HTTPHeaders()
            headers.add(CORRELATION_ID_HEADER, FIXED_UUID_UPPER_CASE)
            read_tracking_id_headers(headers)
            self.assertEqual(mdc.correlation_id.get(), FIXED_UUID_UPPER_CASE)

    def test_read_missing_correlation_id(self):
        read_tracking_id_headers(HTTPHeaders())
        self.assertRegex(mdc.correlation_id.get(), UUID_PATTERN)

    def test_read_invalid_correlation_id(self):
        headers = HTTPHeaders()
        headers.add(CORRELATION_ID_HEADER, 'invalid_header_value')

        with self.assertRaises(tornado.web.HTTPError) as context:
            read_tracking_id_headers(headers)
        raised_exception = context.exception
        self.assertEqual(raised_exception.status_code, 400)
        self.assertEqual(raised_exception.log_message, "Invalid X-Correlation-ID header. Should be an UUIDv4 matching regex \'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$\'")
