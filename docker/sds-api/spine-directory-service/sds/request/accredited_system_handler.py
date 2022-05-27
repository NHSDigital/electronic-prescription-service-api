import json

from urllib.parse import unquote

import tornado

from request.base_handler import BaseHandler, ORG_CODE_QUERY_PARAMETER_NAME, ORG_CODE_FHIR_IDENTIFIER, \
    IDENTIFIER_QUERY_PARAMETER_NAME, SERVICE_ID_FHIR_IDENTIFIER, PARTY_KEY_FHIR_IDENTIFIER, \
    MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME, MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER
from request.content_type_validator import get_valid_accept_type
from request.error_handler import ErrorHandler
from request.fhir_json_mapper import build_bundle_resource, build_device_resource
from request.http_headers import HttpHeaders
from request.tracking_ids_headers_reader import read_tracking_id_headers
from utilities import timing, integration_adaptors_logger as log, mdc

logger = log.IntegrationAdaptorsLogger(__name__)


class AccreditedSystemRequestHandler(BaseHandler, ErrorHandler):
    """A handler for requests to obtain accredited system information."""

    @timing.time_request
    async def get(self):
        read_tracking_id_headers(self.request.headers)

        self._validate_query_params()

        org_code = self.get_required_query_param(ORG_CODE_QUERY_PARAMETER_NAME, ORG_CODE_FHIR_IDENTIFIER)
        service_id = self.get_required_query_param(IDENTIFIER_QUERY_PARAMETER_NAME, SERVICE_ID_FHIR_IDENTIFIER)

        manufacturing_organization = self.get_optional_query_param(MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME, MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER)
        party_key = self.get_optional_query_param(IDENTIFIER_QUERY_PARAMETER_NAME, PARTY_KEY_FHIR_IDENTIFIER)

        accept_type = get_valid_accept_type(self.request.headers)

        logger.info("Looking up accredited system information for {org_code}, {service_id}, {manufacturing_organization}, {party_key}",
                    fparams={"org_code": org_code, "service_id": service_id, 'manufacturing_organization': manufacturing_organization, 'party_key': party_key})
        ldap_result = await self.sds_client.get_as_details(org_code, service_id, manufacturing_organization, party_key)
        logger.info("Obtained accredited system information. {ldap_result}",
                    fparams={"ldap_result": ldap_result})

        base_url = f"{self.request.protocol}://{self.request.host}{self.request.path}/"
        full_url = unquote(self.request.full_url())

        devices = [build_device_resource(ldap_attributes) for ldap_attributes in ldap_result]

        bundle = build_bundle_resource(devices, base_url, full_url)

        self.write(json.dumps(bundle, indent=2, sort_keys=False))
        self.set_header(HttpHeaders.CONTENT_TYPE, accept_type)
        self.set_header(HttpHeaders.X_CORRELATION_ID, mdc.correlation_id.get())

    def _validate_query_params(self):
        query_params = self.request.arguments
        for query_param in query_params.keys():
            if query_param not in [ORG_CODE_QUERY_PARAMETER_NAME, IDENTIFIER_QUERY_PARAMETER_NAME, MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME]:
                raise tornado.web.HTTPError(
                    status_code=400,
                    log_message=f"Illegal query parameter '{query_param}'")
            for query_param_value in query_params[query_param]:
                query_param_value = query_param_value.decode("utf-8")
                if query_param == ORG_CODE_QUERY_PARAMETER_NAME \
                    and not query_param_value.startswith(f"{ORG_CODE_FHIR_IDENTIFIER}|"):
                    self._raise_invalid_query_param_error(ORG_CODE_QUERY_PARAMETER_NAME, ORG_CODE_FHIR_IDENTIFIER)
                if query_param == IDENTIFIER_QUERY_PARAMETER_NAME \
                    and not query_param_value.startswith(f"{SERVICE_ID_FHIR_IDENTIFIER}|") \
                    and not query_param_value.startswith(f"{PARTY_KEY_FHIR_IDENTIFIER}|"):
                    self._raise_invalid_identifier_query_param_error()
                if query_param == MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME \
                    and not query_param_value.startswith(f"{MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER}|"):
                    self._raise_invalid_query_param_error(MANUFACTURING_ORGANIZATION_QUERY_PARAMETER_NAME, MANUFACTURING_ORGANIZATION_FHIR_IDENTIFIER)
