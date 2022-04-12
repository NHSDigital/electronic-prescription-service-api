from lookup import sds_connection_factory
from lookup.sds_client import SDSClient, SDSMockClient
from utilities import config
from utilities import integration_adaptors_logger as log
from utilities.string_utilities import str2bool

logger = log.IntegrationAdaptorsLogger(__name__)


def get_sds_client():
    use_mock = str2bool(config.get_config('MOCK_LDAP_RESPONSE', default=str(False)))
    if use_mock:
        pause_duration = int(config.get_config('MOCK_LDAP_PAUSE', default="0"))
        logger.warning("!!! IMPORTANT !!! Using LDAP mock response with %sms delay", pause_duration)
        return SDSMockClient()
    else:
        sds_connection = sds_connection_factory.create_connection()
        search_base = config.get_config("LDAP_SEARCH_BASE")
        return SDSClient(sds_connection, search_base)
