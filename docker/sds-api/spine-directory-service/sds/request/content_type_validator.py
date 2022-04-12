import tornado.web
from tornado.httputil import HTTPHeaders

from request.http_headers import HttpHeaders
from utilities import integration_adaptors_logger as log

logger = log.IntegrationAdaptorsLogger(__name__)

ANY = '*/*'
APPLICATION_JSON = 'application/json'
APPLICATION_FHIR_JSON = 'application/fhir+json'


def get_valid_accept_type(headers: HTTPHeaders):
    accept_types = headers.get(HttpHeaders.ACCEPT, APPLICATION_FHIR_JSON).lower()
    accept_types = accept_types.split(",")
    accept_types = list(map(lambda value: value.strip(), accept_types))

    if ANY in accept_types or APPLICATION_FHIR_JSON in accept_types:
        return APPLICATION_FHIR_JSON
    elif APPLICATION_JSON in accept_types:
        return APPLICATION_JSON
    else:
        logger.info("Invalid Accept header in request")
        raise tornado.web.HTTPError(status_code=406,
                                    log_message=f'Invalid Accept header in request, only: {APPLICATION_JSON} or {APPLICATION_FHIR_JSON} are allowed')
