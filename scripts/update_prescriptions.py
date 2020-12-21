#!/usr/bin/env python

import os
import glob
import json
import uuid
from datetime import datetime
import requests

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


def load_prepare_examples():
    for filename in glob.iglob(examples_root_dir + '**/*Prepare-Request*.json', recursive=True):
        yield filename


def replace_ids_and_timestamps(bundle_json, prescription_id, short_prescription_id, authored_on):
    for entry in bundle_json['entry']:
        resource = entry["resource"]
        if resource["resourceType"] == "MedicationRequest":
            resource["groupIdentifier"]["value"] = short_prescription_id
            for extension in resource["groupIdentifier"]["extension"]:
                if extension["url"] == "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId":
                    extension["valueIdentifier"]["value"] = prescription_id
            resource["authoredOn"] = authored_on
        if resource["resourceType"] == "Provenance":
            for signature in resource["signature"]:
                signature["when"] = authored_on


def update_prepare_examples(prepare, prescription_id, short_prescription_id, authored_on):
    with open(prepare) as f:
        prepare_request_json = json.load(f)
    replace_ids_and_timestamps(prepare_request_json, prescription_id, short_prescription_id, authored_on)
    with open(prepare, 'w') as f:
        json.dump(prepare_request_json, f, indent=2)

    prepare_response_json = requests.post(
        'http://localhost:9000/$prepare',
        data=json.dumps(prepare_request_json),
        headers={'Content-Type': 'application/json'}).json()

    example_dir = os.path.dirname(prepare)
    file = os.path.basename(prepare)
    filename_parts = file.split('-')
    number = filename_parts[0]
    status_code_and_ext = filename_parts[4] if len(filename_parts) == 5 else filename_parts[3]

    prepare_response = f'{example_dir}/{number}-Prepare-Response-{status_code_and_ext}'

    with open(prepare_response, 'w') as f:
        json.dump(prepare_response_json, f, indent=2)


def update_process_examples(prepare, prescription_id, short_prescription_id, authored_on):
    example_dir = os.path.dirname(prepare)
    file = os.path.basename(prepare)
    filename_parts = file.split('-')
    number = filename_parts[0]
    status_code_and_ext = filename_parts[4] if len(filename_parts) == 5 else filename_parts[3]

    for process in glob.iglob(f'{example_dir}/{number}-Process-Request-*-{status_code_and_ext}'):
        with open(process) as f:
            process_request_json = json.load(f)
        replace_ids_and_timestamps(process_request_json, prescription_id, short_prescription_id, authored_on)
        with open(process, 'w') as f:
            json.dump(process_request_json, f, indent=2)

        example_dir = os.path.dirname(process)
        file = os.path.basename(process)
        filename_parts = file.split('-')
        number = filename_parts[0]
        operation = filename_parts[3]
        status_code_and_ext = filename_parts[4] if len(filename_parts) == 5 else filename_parts[3]
        status_code_and_xml_ext = status_code_and_ext.replace("json", "xml")
        convert_response = f'{example_dir}/{number}-Convert-Response-{operation}-{status_code_and_xml_ext}'

        convert_response_xml = requests.post(
            'http://localhost:9000/$convert',
            data=json.dumps(process_request_json),
            headers={'Content-Type': 'application/json'}).text

        with open(convert_response, 'w') as f:
            f.write(convert_response_xml)


def update_examples():
    authored_on = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')

    for prepare in load_prepare_examples():
        prescription_id = str(uuid.uuid4())
        short_prescription_id = generate_short_form_id()

        update_prepare_examples(prepare, prescription_id, short_prescription_id, authored_on)
        update_process_examples(prepare, prescription_id, short_prescription_id, authored_on)


update_examples()
