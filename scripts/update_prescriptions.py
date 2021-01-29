#!/usr/bin/env python

"""
update_prescriptions.py

Usage:
  update_prescriptions.py API_BASE_URL
"""
import os
import glob
import json
import uuid
from datetime import datetime
import requests
from docopt import docopt

examples_root_dir = "../models/examples/"


def generate_short_form_id():
    """Create R2 (short format) Prescription ID
    Build the prescription ID and add the required checkdigit.
    Checkdigit is selected from the PRESCRIPTION_CHECKDIGIT_VALUES constant
    """
    _PRESCRIPTION_CHECKDIGIT_VALUES = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+'
    hex_string = str(uuid.uuid1()).replace('-', '').upper()
    prescription_id = f'{hex_string[:6]}-Z{hex_string[6:11]}-{hex_string[12:17]}'
    prescription_id_digits = prescription_id.replace('-', '')
    prescription_id_digits_length = len(prescription_id_digits)
    running_total = 0
    for string_position in range(prescription_id_digits_length):
        running_total = running_total\
                       + int(prescription_id_digits[string_position], 36)\
                       * (2 ** (prescription_id_digits_length - string_position))
    check_value = (38 - running_total % 37) % 37
    check_value = _PRESCRIPTION_CHECKDIGIT_VALUES[check_value]
    prescription_id += check_value
    return prescription_id


def find_prepare_request_paths():
    for filename in glob.iglob(examples_root_dir + '**/*Prepare-Request*200_OK*.json', recursive=True):
        yield filename


def replace_ids_and_timestamps(bundle_json, prescription_id, short_prescription_id, authored_on, signature_time):
    short_prescription_id_split = short_prescription_id.split("-")
    short_prescription_id_first = short_prescription_id_split[0]
    short_prescription_id_middle = ""
    short_prescription_id_last = short_prescription_id_split[2]
    
    for entry in reversed(bundle_json['entry']):
        resource = entry["resource"]
        if resource["resourceType"] == "Provenance":
            for signature in resource["signature"]:
                signature["when"] = signature_time
        if resource["resourceType"] == "HealthcareService":
            for identifier in resource["identifier"]:
                organisationCode = identifier["value"]
                short_prescription_id_middle = organisationCode
        if resource["resourceType"] == "MedicationRequest":
            resource["groupIdentifier"]["value"] = short_prescription_id_first + "-" + short_prescription_id_middle + "-" + short_prescription_id_last
            for extension in resource["groupIdentifier"]["extension"]:
                if extension["url"] == "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId":
                    extension["valueIdentifier"]["value"] = prescription_id
            resource["authoredOn"] = authored_on


def update_prepare_examples(api_base_url, prepare_request_path, prescription_id, short_prescription_id, authored_on):
    with open(prepare_request_path) as f:
        prepare_request_json = json.load(f)
    replace_ids_and_timestamps(prepare_request_json, prescription_id, short_prescription_id, authored_on, None)
    with open(prepare_request_path, 'w') as f:
        json.dump(prepare_request_json, f, indent=2)

    prepare_response_json = requests.post(
        api_base_url + '/$prepare',
        data=json.dumps(prepare_request_json),
        headers={'Content-Type': 'application/json'}
    ).json()

    prepare_response_path = derive_prepare_response_path(prepare_request_path)
    with open(prepare_response_path, 'w') as f:
        json.dump(prepare_response_json, f, indent=2)

    for parameter in prepare_response_json["parameter"]:
        if parameter["name"] == "timestamp":
            return parameter["valueString"]


def derive_prepare_response_path(prepare_request_path):
    example_dir = os.path.dirname(prepare_request_path)
    file = os.path.basename(prepare_request_path)
    filename_parts = file.split('-')
    number = filename_parts[0]
    status_code_and_ext = filename_parts[-1]
    return f'{example_dir}/{number}-Prepare-Response-{status_code_and_ext}'


def update_process_examples(
    api_base_url, prepare_request_path, prescription_id, short_prescription_id, authored_on, signature_time
):
    process_request_path_pattern = derive_process_request_path_pattern(prepare_request_path)
    for process_request_path in glob.iglob(process_request_path_pattern):
        with open(process_request_path) as f:
            process_request_json = json.load(f)
        replace_ids_and_timestamps(
            process_request_json, prescription_id, short_prescription_id, authored_on, signature_time
        )
        with open(process_request_path, 'w') as f:
            json.dump(process_request_json, f, indent=2)

        convert_response_xml = requests.post(
            api_base_url + '/$convert',
            data=json.dumps(process_request_json),
            headers={'Content-Type': 'application/json'}
        ).text

        convert_response_path = derive_convert_response_path(process_request_path)
        with open(convert_response_path, 'w') as f:
            f.write(convert_response_xml)


def derive_process_request_path_pattern(prepare_request_path):
    example_dir = os.path.dirname(prepare_request_path)
    file = os.path.basename(prepare_request_path)
    filename_parts = file.split('-')
    number = filename_parts[0]
    status_code_and_ext = filename_parts[-1]
    return f'{example_dir}/{number}-Process-Request-*-{status_code_and_ext}'


def derive_convert_response_path(process_request_path):
    example_dir = os.path.dirname(process_request_path)
    file = os.path.basename(process_request_path)
    filename_parts = file.split('-')
    number = filename_parts[0]
    operation = filename_parts[3]
    status_code_and_ext = filename_parts[-1]
    status_code_and_xml_ext = status_code_and_ext.replace("json", "xml")
    return f'{example_dir}/{number}-Convert-Response-{operation}-{status_code_and_xml_ext}'


def update_examples(api_base_url):
    authored_on = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')

    for prepare_request_path in find_prepare_request_paths():
        prescription_id = str(uuid.uuid4())
        short_prescription_id = generate_short_form_id()

        signature_time = update_prepare_examples(
            api_base_url, prepare_request_path, prescription_id, short_prescription_id, authored_on
        )
        update_process_examples(
            api_base_url, prepare_request_path, prescription_id, short_prescription_id, authored_on,
            signature_time
        )


def main(arguments):
    arguments = docopt(__doc__, version="0")
    update_examples(arguments["API_BASE_URL"])


if __name__ == "__main__":
    main(arguments=docopt(__doc__, version="0"))
