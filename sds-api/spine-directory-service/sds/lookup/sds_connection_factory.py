import ssl

import ldap3

import definitions
from utilities import certs, config, integration_adaptors_logger as log, secrets
from utilities.string_utilities import str2bool

_LDAP_CONNECTION_RETRIES = int(config.get_config('LDAP_CONNECTION_RETRIES', default='3'))
_LDAP_CONNECTION_TIMEOUT_IN_SECONDS = int(config.get_config('LDAP_CONNECTION_TIMEOUT_IN_SECONDS', default='5'))
logger = log.IntegrationAdaptorsLogger(__name__)


def _build_sds_connection(ldap_address: str) -> ldap3.Connection:
    """
    Given an ldap service address this will return a ldap3 connection object
    """
    ldap3.set_config_parameter('RESTARTABLE_TRIES', _LDAP_CONNECTION_RETRIES)
    server = ldap3.Server(ldap_address, connect_timeout=_LDAP_CONNECTION_TIMEOUT_IN_SECONDS)
    logger.info('Configuring LDAP connection without TLS')
    return _configure_ldap_connection(server)


def _build_sds_connection_tls(ldap_address: str, private_key: str, local_cert: str, ca_certs: str
                              ) -> ldap3.Connection:
    """
    This will return a connection object for the given ip along with loading the given certification files
    :param ldap_address: The URL of the LDAP server to connect to.
    :param private_key: A string containing the client private key.
    :param local_cert: A string containing the client certificate.
    :param ca_certs: A string containing certificate authority certificates
    :return: Connection object using the given cert files
    """
    certificates = certs.Certs.create_certs_files(definitions.ROOT_DIR, private_key=private_key, local_cert=local_cert,
                                                  ca_certs=ca_certs)

    load_tls = ldap3.Tls(local_private_key_file=certificates.private_key_path,
                         local_certificate_file=certificates.local_cert_path, validate=ssl.CERT_NONE,
                         version=ssl.PROTOCOL_TLSv1_2, ca_certs_file=certificates.ca_certs_path)

    ldap3.set_config_parameter('RESTARTABLE_TRIES', _LDAP_CONNECTION_RETRIES)
    server = ldap3.Server(ldap_address, port=636, use_ssl=True, tls=load_tls, connect_timeout=_LDAP_CONNECTION_TIMEOUT_IN_SECONDS)
    logger.info('Configuring LDAP connection using TLS')

    return _configure_ldap_connection(server)


def _configure_ldap_connection(server) -> ldap3.Connection:
    lazy_ldap = str2bool(config.get_config("LDAP_LAZY_CONNECTION", default=str(True)))
    if lazy_ldap:
        connection = ldap3.Connection(server,
                                      lazy=True,
                                      auto_bind=ldap3.AUTO_BIND_NO_TLS,
                                      client_strategy=ldap3.ASYNC)
    else:
        connection = ldap3.Connection(server,
                                      auto_bind=True,
                                      client_strategy=ldap3.REUSABLE)
    logger.info('LDAP connection configured successfully')
    return connection


def create_connection() -> ldap3.Connection:
    ldap_url = config.get_config("LDAP_URL")
    disable_tls_flag = config.get_config("LDAP_DISABLE_TLS", None)
    use_tls = disable_tls_flag != "True"
    logger.info('Configuring connection to LDAP using {url} {tls}', fparams={"url": ldap_url, "tls": use_tls})

    if use_tls:
        client_key = secrets.get_secret_config('CLIENT_KEY')
        client_cert = secrets.get_secret_config('CLIENT_CERT')
        ca_certs = secrets.get_secret_config('CA_CERTS')

        sds_connection = _build_sds_connection_tls(ldap_address=ldap_url,
                                                   private_key=client_key,
                                                   local_cert=client_cert,
                                                   ca_certs=ca_certs)
    else:
        sds_connection = _build_sds_connection(ldap_address=ldap_url)

    return sds_connection
