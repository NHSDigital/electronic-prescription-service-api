import json

import tornado.web
from lookup.sds_client_factory import get_sds_client
from request.http_headers import HttpHeaders
from utilities import config

PASS = "pass"
FAIL = "fail"


class HealthcheckHandler(tornado.web.RequestHandler):
    """
    A Tornado request handler that returns an empty HTTP 200 response for any GET requests, without
    doing anything else. This handler is intended to be hit by anything that wants to check that the
    application is running ie for load balancers to do healthchecks.
    """

    async def get(self):
        """
        ---
        summary: Healthcheck endpoint
        description: >-
          This endpoint just returns a HTTP 200 response and does no further processing. This endpoint
          is intended to be used by load balancers/other infrastructure to check that the server is
          running.
        operationId: getHealthcheck
        responses:
          200:
            description: The only response this endpoint returns.
        """
        self.set_status(200)


class DeepHealthcheckHandler(tornado.web.RequestHandler):
    """
    A Tornado request handler that returns an empty HTTP 200 response for any GET requests if LDAP connection is up.
    This handler is intended to be hit by anything that wants to check that the
    application is running and is able to serve data.
    """

    async def get(self):
        """
        ---
        summary: Healthcheck endpoint
        description: >-
          This endpoint just returns a HTTP 200 response and does no further processing. This endpoint
          is intended to be used by load balancers/other infrastructure to check that the server is
          running.
        operationId: getHealthcheck
        responses:
          200:
            description: The only response this endpoint returns.
        """

        status = FAIL
        output = None
        try:
            await get_sds_client().get_mhs_details('TEST', 'TEST', 'TEST')
            status = PASS
        except Exception as ex:
            output = str(ex)

        response_data = {
            "status": status,
            "details": {
                "ldap": {
                    "status": status,
                    "links": {
                        "ldap": config.get_config("LDAP_URL", None)
                    },
                    "output": output if output else ''
                }
            }
        }

        self.write(json.dumps(response_data, indent=4))
        self.set_header(HttpHeaders.CONTENT_TYPE, "application/json")
        self.set_status(200 if status == PASS else 503)
