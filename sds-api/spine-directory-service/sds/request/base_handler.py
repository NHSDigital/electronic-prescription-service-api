from typing import Optional

import tornado.web

from lookup.sds_client import SDSClient
from utilities import mdc, message_utilities

ORG_CODE_QUERY_PARAMETER_NAME = "organization"
IDENTIFIER_QUERY_PARAMETER_NAME = "identifier"
MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME = "manufacturing-organization"

ORG_CODE_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/ods-organization-code"
SERVICE_ID_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/nhsServiceInteractionId"
PARTY_KEY_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/nhsMhsPartyKey"
MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER = "https://fhir.nhs.uk/Id/ods-organization-code"


class BaseHandler(tornado.web.RequestHandler):
    """A base handler for spine route lookup"""
    sds_client: SDSClient

    def initialize(self, sds_client: SDSClient) -> None:
        """Initialise this request handler with the provided configuration values.

        :param sds_client: The sds client component to use to look up values in SDS.
        """
        mdc.trace_id.set(message_utilities.get_uuid())
        self.sds_client = sds_client

    def prepare(self):
        if self.request.method != "GET":
            raise tornado.web.HTTPError(
                status_code=405,
                log_message="Method not allowed.")

    def get_required_query_param(self, query_param_name: str, fhir_identifier: str) -> Optional[str]:
        value = self.get_optional_query_param(query_param_name, fhir_identifier)
        if not value:
            self._raise_invalid_query_param_error(query_param_name, fhir_identifier)
        return value

    def get_optional_query_param(self, query_param_name: str, fhir_identifier: str) -> Optional[str]:
        values = list(filter(
            lambda value: "|" in value and value.split("|")[0] == fhir_identifier and value[value.index("|") + 1:].strip(),
            self.get_query_arguments(query_param_name)))

        last_value = values and values[-1]
        result_value = (last_value and last_value[last_value.index("|") + 1:]) or None
        return result_value

    def _raise_invalid_query_param_error(self, query_param_name, fhir_identifier):
        raise tornado.web.HTTPError(
            status_code=400,
            log_message=f"Missing or invalid '{query_param_name}' query parameter. Should be '{query_param_name}={fhir_identifier}|value'")

    def _raise_invalid_identifier_query_param_error(self):
        raise tornado.web.HTTPError(
            status_code=400,
            log_message=f"Missing or invalid '{IDENTIFIER_QUERY_PARAMETER_NAME}' query parameter. "
                        f"Should be one or both of: ["
                        f"'{IDENTIFIER_QUERY_PARAMETER_NAME}={SERVICE_ID_FHIR_IDENTIFIER}|value', "
                        f"'{IDENTIFIER_QUERY_PARAMETER_NAME}={PARTY_KEY_FHIR_IDENTIFIER}|value'")
