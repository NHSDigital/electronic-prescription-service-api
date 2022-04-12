from typing import Dict, List, Optional

from request.base_handler import SERVICE_ID_FHIR_IDENTIFIER
from request.mapper_urls import MapperUrls as Url
from utilities import message_utilities
from utilities import integration_adaptors_logger as log


logger = log.IntegrationAdaptorsLogger(__name__)


def build_bundle_resource(resources: List[Dict], base_url: str, full_url: str):
    return {
        "resourceType": "Bundle",
        "id": message_utilities.get_uuid(),
        "type": "searchset",
        "total": len(resources),
        "link": [
            {
                "relation": "self",
                "url": full_url
            }
        ],
        "entry": list(map(lambda resource: _map_resource_to_bundle_entry(resource, base_url), resources))
    }


def _map_resource_to_bundle_entry(resource, base_url):
    return {
        "fullUrl": base_url + resource["id"],
        "resource": resource,
        "search": {
            "mode": "match"
        }
    }


def build_endpoint_resources(ldap_attributes: dict) -> List[Dict]:
    def build_endpoint(address):
        result = {
            "resourceType": "Endpoint",
            "id": str(message_utilities.get_uuid()),
            "status": "active",
            "connectionType": build_connection_type(),
            "payloadType": _build_payload_type()
        }
        if address:
            result["address"] = address

        managing_organization = _build_managing_organization(ldap_attributes.get("nhsIDCode"))
        if managing_organization:
            result["managingOrganization"] = managing_organization

        identifiers = _build_identifier_array(ldap_attributes)
        identifiers = list(filter(lambda item: item, identifiers))
        if identifiers:
            result["identifier"] = identifiers

        extensions = []
        reliability_configuration_extensions = _build_extension_array(ldap_attributes)
        reliability_configuration_extensions = list(filter(lambda item: item, reliability_configuration_extensions))
        if reliability_configuration_extensions:
            extensions.append({
                "url": Url.EXTENSION_URL,
                "extension": reliability_configuration_extensions
            })
        interaction_id = ldap_attributes.get("nhsMhsSvcIA")
        if interaction_id:
            extensions.append(_build_value_reference_extension(
                Url.SDS_SERVICE_INTERACTION_ID_URL, SERVICE_ID_FHIR_IDENTIFIER, interaction_id))

        if extensions:
            result["extension"] = extensions

        return result
    return [build_endpoint(address) for address in ldap_attributes.get('nhsMHSEndPoint', [None]) or [None]]


def build_device_resource(ldap_attributes: dict) -> Dict:
    device = {
        "resourceType": "Device",
        "id": str(message_utilities.get_uuid())
    }

    identifiers = []
    unique_identifier = ldap_attributes.get('uniqueIdentifier', [None]) or [None]
    if len(unique_identifier) > 1:
        raise ValueError("LDAP returned more than 1 'uniqueIdentifier' attribute")
    unique_identifier = unique_identifier[0]
    if unique_identifier:
        identifiers.append(build_identifier(Url.NHS_SPINE_ASID, unique_identifier))
    party_key = ldap_attributes.get('nhsMhsPartyKey')
    if party_key:
        identifiers.append(build_identifier(Url.NHS_MHS_PARTYKEY_URL, party_key))
    if identifiers:
        device['identifier'] = identifiers

    extension = []
    manufacturing_organization = ldap_attributes.get('nhsMhsManufacturerOrg')
    if manufacturing_organization:
        extension.append(
            _build_value_reference_extension(
                Url.MANUFACTURING_ORGANIZATION_EXTENSION_URL, Url.MANUFACTURING_ORGANIZATION_URL, manufacturing_organization))
    service_id_extensions = map(
        lambda v: _build_value_reference_extension(Url.SDS_SERVICE_INTERACTION_ID_URL, SERVICE_ID_FHIR_IDENTIFIER, v),
        ldap_attributes.get('nhsAsSvcIA', [None]) or [None])
    service_id_extensions = list(filter(lambda x: x, service_id_extensions))
    if service_id_extensions:
        extension += service_id_extensions
    if extension:
        device['extension'] = extension

    client_id = ldap_attributes.get('nhsAsClient', [None]) or [None]
    if len(client_id) > 1:
        raise ValueError("LDAP returned more than 1 'nhsAsClient' attribute")
    client_id = client_id[0]
    if client_id:
        device["owner"] = {
            "identifier": {
                "system": Url.MANUFACTURING_ORGANIZATION_URL,
                "value": client_id
            }
        }

    return device


def _build_identifier_array(ldap_attributes: Dict):
    unique_identifiers = ldap_attributes.get("uniqueIdentifier", [None]) or [None]
    if len(unique_identifiers) > 1:
        raise ValueError("LDAP returned more than 1 'uniqueIdentifier' attribute")

    return [
        build_identifier(Url.NHS_MHS_FQDN_URL, ldap_attributes.get("nhsMhsFQDN")),
        build_identifier(Url.NHS_MHS_PARTYKEY_URL, ldap_attributes.get("nhsMHSPartyKey")),
        build_identifier(Url.NHS_MHS_CPAID_URL, ldap_attributes.get("nhsMhsCPAId")),
        build_identifier(Url.NHS_MHS_ID, unique_identifiers[0])
    ]


def _build_extension_array(ldap_attributes: Dict):
    actor = ldap_attributes.get("nhsMHSActor", [None]) or [None]
    if len(actor) > 1:
        raise ValueError("LDAP returned more than 1 'nhsMHSActor' attribute")

    return [
        _build_string_extension("nhsMHSSyncReplyMode", ldap_attributes.get("nhsMHSSyncReplyMode")),
        _build_string_extension("nhsMHSRetryInterval", ldap_attributes.get("nhsMHSRetryInterval")),
        _build_int_extension("nhsMHSRetries", ldap_attributes.get("nhsMHSRetries")),
        _build_string_extension("nhsMHSPersistDuration", ldap_attributes.get("nhsMHSPersistDuration")),
        _build_string_extension("nhsMHSDuplicateElimination", ldap_attributes.get("nhsMHSDuplicateElimination")),
        _build_string_extension("nhsMHSAckRequested", ldap_attributes.get("nhsMHSAckRequested")),
        _build_string_extension("nhsMHSActor", actor[0])
    ]


def _build_string_extension(url: str, value: Optional[str]):
    return {
        "url": url,
        "valueString": value
    } if value else None


def _build_value_reference_extension(url: str, system: str, value: Optional[str]):
    return {
        "url": url,
        "valueReference": {
            "identifier": {
                "system": system,
                "value": value
            }
        }
    } if value else None


def _build_int_extension(url: str, value: Optional[str]):
    return {
        "url": url,
        "valueInteger": int(value)
    } if value else None


def build_identifier(system: str, value: Optional[str]):
    return {
        "system": system,
        "value": value
    } if value else None


def build_connection_type():
    return {
        "system": Url.CONNECTION_TYPE_URL,
        "code": "hl7-fhir-msg",
        "display": "HL7 FHIR Messaging"
    }


def _build_managing_organization(value: Optional[str]):
    return {
        "identifier": build_identifier(Url.MANAGING_ORGANIZATION_URL, value)
    } if value else None


def _build_payload_type():
    return [
        {
            "coding": [
                {
                    "system": Url.PAYLOAD_TYPE_URL,
                    "code": "any",
                    "display": "Any"
                }
            ]
        }
    ]


def _build_address(value: str):
    return "https://{}/".format(value)
