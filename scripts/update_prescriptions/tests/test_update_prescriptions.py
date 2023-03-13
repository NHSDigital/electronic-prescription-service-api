import os
import pytest
import json
from datetime import date, timedelta

from prescriptions import update_prescription

from resources import (
    get_authorizing_prescriptions,
    get_dm_prescription,
    get_extensions,
    get_group_identifiers,
    get_medication_dispenses,
    get_organisations,
    get_organisation_code,
    get_resource,
    get_signature_timestamp_from_prepare_response,
    update_resource
)

from utils import (
    find_prepare_request_paths,
    generate_short_form_id,
    sort_by_main_organistion_last
)


# Tests
test_examples_root_dir = f".{os.path.sep}examples"
secondary_care_example_dir = f"community{os.path.sep}repeat-dispensing{os.path.sep}nominated-pharmacy{os.path.sep}clinical-practitioner{os.path.sep}single-medication-request" # noqa E501
primary_care_example_dir = f"repeat-dispensing{os.path.sep}nominated-pharmacy{os.path.sep}medical-prescriber{os.path.sep}author{os.path.sep}gmc{os.path.sep}responsible-party{os.path.sep}medication-list{os.path.sep}din" # noqa E501


def get_repeat_dispensing_process_request_example(care_setting):
    examples_dir = f'{test_examples_root_dir}{os.path.sep}{care_setting}{os.path.sep}'

    if (care_setting == "secondary-care"):
        process_request_file = f'{examples_dir}{secondary_care_example_dir}{os.path.sep}1-Process-Request-Send-200_OK.json' # noqa E501
    elif (care_setting == "primary-care"):
        process_request_file = f'{examples_dir}{primary_care_example_dir}{os.path.sep}1-Process-Request-Send-200_OK.json' # noqa E501
    with open(process_request_file) as f:
        process_request_json = json.load(f)
    return process_request_json


@pytest.fixture
# ensure process request examples are repeat-dispensing to cover validity_period test
def secondary_care_repeat_dispensing_process_request():
    return get_repeat_dispensing_process_request_example("secondary-care")


@pytest.fixture
def primary_care_repeat_dispensing_process_request():
    return get_repeat_dispensing_process_request_example("primary-care")


@pytest.fixture
def success_prepare_response_json():
    prepare_response_file = f'{test_examples_root_dir}{os.path.sep}primary-care{os.path.sep}{primary_care_example_dir}{os.path.sep}1-Prepare-Response-200_OK.json' # noqa E501
    with open(prepare_response_file) as f:
        prepare_response_json = json.load(f)
    return prepare_response_json


def test_generate_short_form_id__contains_org_code_in_middle():
    organisation_code = "testOrgCode"
    short_form_id = generate_short_form_id(organisation_code)
    short_form_id_split = short_form_id.split("-")
    assert len(short_form_id_split) == 3
    short_form_id_middle = short_form_id_split[1]
    assert short_form_id_middle == organisation_code


def test_find_prepare_request_paths__finds_prepare_examples():
    for _ in find_prepare_request_paths(f'{test_examples_root_dir}{os.path.sep}'):
        break
    else:
        raise RuntimeError('Failed to find any prepare examples')


def test_update_prescription__updates_prescription_id(secondary_care_repeat_dispensing_process_request):
    prescription_id = "newValue"
    update_prescription(secondary_care_repeat_dispensing_process_request, None, prescription_id, None, None, None)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "MedicationRequest":
            for extension in resource["groupIdentifier"]["extension"]:
                if extension["url"] == "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId":
                    prescription_id_updated = extension["valueIdentifier"]["value"]
    assert prescription_id == prescription_id_updated


def test_update_prescription__updates_short_prescription_id(secondary_care_repeat_dispensing_process_request):
    short_prescription_id = "newValue"
    update_prescription(secondary_care_repeat_dispensing_process_request, None, None, short_prescription_id, None, None)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "MedicationRequest":
            short_prescription_id_updated = resource["groupIdentifier"]["value"]
    assert short_prescription_id == short_prescription_id_updated


def test_update_prescription__updates_signature_time(secondary_care_repeat_dispensing_process_request):
    signature_time = "newValue"
    update_prescription(secondary_care_repeat_dispensing_process_request, None, None, None, None, signature_time)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "Provenance":
            for signature in resource["signature"]:
                signature_time_updated = signature["when"]
                break
    assert signature_time == signature_time_updated


def test_update_prescription__updates_authored_on(secondary_care_repeat_dispensing_process_request):
    authored_on = "newValue"
    update_prescription(secondary_care_repeat_dispensing_process_request, None, None, None, authored_on, None)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "MedicationRequest":
            authored_on_updated = resource["authoredOn"]
    assert authored_on == authored_on_updated


def test_update_prescription__sets_validity_period_for_4_weeks_from_today(
    secondary_care_repeat_dispensing_process_request
):
    update_prescription(secondary_care_repeat_dispensing_process_request, None, None, None, None, None)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "MedicationRequest":
            if "validityPeriod" in resource["dispenseRequest"]:
                validity_start = resource["dispenseRequest"]["validityPeriod"]["start"]
                validity_end = resource["dispenseRequest"]["validityPeriod"]["end"]
    assert validity_start == date.today().isoformat()
    assert validity_end == (date.today() + timedelta(weeks=4)).isoformat()


def test_get_organisation_code__gets_org_code_from_secondary_care(secondary_care_repeat_dispensing_process_request):
    organisation_code = get_organisation_code(secondary_care_repeat_dispensing_process_request)
    for entry in secondary_care_repeat_dispensing_process_request['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "HealthcareService":
            for identifier in resource["identifier"]:
                actual_organisation_code = identifier["value"]
    assert organisation_code == actual_organisation_code


def test_get_organisation_code__gets_org_code_from_primary_care(primary_care_repeat_dispensing_process_request):
    organisation_code = get_organisation_code(primary_care_repeat_dispensing_process_request)
    resources = map(get_resource, primary_care_repeat_dispensing_process_request['entry'])
    organisations = filter(get_organisations, resources)
    sorted_organisations = sorted(organisations, key=sort_by_main_organistion_last)
    for organisation in sorted_organisations:
        for identifier in organisation["identifier"]:
            actual_organisation_code = identifier["value"]
    assert organisation_code == actual_organisation_code


def test_get_signature_timestamp_from_prepare_response(success_prepare_response_json):
    signature_time = "newValue"
    for parameter in success_prepare_response_json["parameter"]:
        if parameter["name"] == "timestamp":
            parameter["valueString"] = signature_time
    signature_time_updated = get_signature_timestamp_from_prepare_response(success_prepare_response_json)
    assert signature_time == signature_time_updated
