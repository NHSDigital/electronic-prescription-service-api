import asyncio
import json

import tornado.testing
from tornado.web import Application
from unittest.mock import MagicMock, patch
from request import healthcheck_handler

LDAP_URL = 'ldap://some_domain'
PASS = 'pass'
FAIL = 'fail'


class TestHealthcheckHandler(tornado.testing.AsyncHTTPTestCase):

    def test_success_health(self):
        response = self.fetch('/healthcheck', method='GET')

        self.assertEqual(200, response.code)

    @patch('request.healthcheck_handler.config')
    @patch('request.healthcheck_handler.get_sds_client')
    def test_success_deep_healthcheck(self, mock_get_sds_client, mock_config):
        mock_config.get_config.return_value = LDAP_URL

        empty_future = asyncio.Future()
        empty_future.set_result(None)
        mock_get_mhs_details = MagicMock()
        mock_get_mhs_details.get_mhs_details.return_value = empty_future
        mock_get_sds_client.return_value = mock_get_mhs_details

        response = self.fetch('/healthcheck/deep', method='GET')

        self.assertEqual(200, response.code)
        response_body = json.loads(response.body.decode())
        self.assertEqual(PASS, response_body['status'])
        self.assertEqual(PASS, response_body['details']['ldap']['status'])
        self.assertEqual(LDAP_URL, response_body['details']['ldap']['links']['ldap'])
        self.assertEqual('', response_body['details']['ldap']['output'])

    @patch('request.healthcheck_handler.config')
    @patch('request.healthcheck_handler.get_sds_client')
    def test_failure_deep_healthcheck(self, mock_get_sds_client, mock_config):
        mock_config.get_config.return_value = LDAP_URL

        mock_get_mhs_details = MagicMock()
        mock_get_mhs_details.get_mhs_details.side_effect = RuntimeError('some error')
        mock_get_sds_client.return_value = mock_get_mhs_details

        response = self.fetch('/healthcheck/deep', method='GET')

        self.assertEqual(503, response.code)
        response_body = json.loads(response.body.decode())
        self.assertEqual(FAIL, response_body['status'])
        self.assertEqual(FAIL, response_body['details']['ldap']['status'])
        self.assertEqual(LDAP_URL, response_body['details']['ldap']['links']['ldap'])
        self.assertEqual('some error', response_body['details']['ldap']['output'])

    def get_app(self) -> Application:
        return tornado.web.Application(
            [
                (r'/healthcheck', healthcheck_handler.HealthcheckHandler),
                (r'/healthcheck/deep', healthcheck_handler.DeepHealthcheckHandler),
            ])
