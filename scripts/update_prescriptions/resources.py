from datetime import date, datetime, timedelta

from utils import sort_by_main_organistion_last


def get_resource(entry):
    return entry["resource"]


def get_organisations(resource):
    return resource["resourceType"] == "Organization"


def get_medication_dispenses(resource):
    return resource["resourceType"] == "MedicationDispense"


def update_handover(resource, authored_on):
    resource["whenHandedOver"] = authored_on
    return resource


def get_authorizing_prescriptions(resource):
    return resource["authorizingPrescription"]


def get_extensions(resource):
    return resource["extension"]


def get_group_identifiers(extension):
    return extension["url"] == "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier"


def get_dm_prescription(extension):
    return extension["url"] == "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"


def get_signature_timestamp_from_prepare_response(prepare_response_json):
    for parameter in prepare_response_json["parameter"]:
        if parameter["name"] == "timestamp":
            return parameter["valueString"]
        


def update_handover(resource, authored_on):
    resource["whenHandedOver"] = authored_on
    return resource


def update_extension_url(extension, short_prescription_id, prescription_id):
    if extension["url"] == "shortForm":
        extension["valueIdentifier"]["value"] = short_prescription_id
    if extension["url"] == "UUID":
        extension["valueIdentifier"]["value"] = prescription_id
    return extension


def get_organisation_code(prepare_request_json):
    # secondary-care
    for entry in prepare_request_json["entry"]:
        resource = get_resource(entry)
        if resource["resourceType"] == "HealthcareService":
            for identifier in resource["identifier"]:
                return identifier["value"]
    # primary care
    resources = map(get_resource, prepare_request_json['entry'])
    organisations = filter(get_organisations, resources)
    sorted_organisations = sorted(organisations, key=sort_by_main_organistion_last)
    for organisation in sorted_organisations:
        for identifier in organisation["identifier"]:
            return identifier["value"]


def update_resource(resource, signature_time, short_prescription_id, prescription_id, authored_on):
    if resource["resourceType"] == "Provenance":
        for signature in resource["signature"]:
            signature["when"] = signature_time
        
    if resource["resourceType"] == "MedicationRequest":
        resource["groupIdentifier"]["value"] = short_prescription_id
        resource["authoredOn"] = authored_on

        extensions = iter(resource["groupIdentifier"]["extension"])
        prescriptions = filter(get_dm_prescription, extensions)
        for prescription in prescriptions:
            prescription["valueIdentifier"]["value"] = prescription_id

        if "validityPeriod" in resource["dispenseRequest"]:
            resource["dispenseRequest"]["validityPeriod"]["start"] = date.today().isoformat()
            resource["dispenseRequest"]["validityPeriod"]["end"] = (date.today() + timedelta(weeks=4)).isoformat() # noqa E501
