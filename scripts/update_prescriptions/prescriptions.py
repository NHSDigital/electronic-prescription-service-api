from fileio import (
    save_prepare_request,
    save_prepare_response,
    save_convert_response
)

from resources import (
    get_resource,
    get_authorizing_prescriptions,
    update_resource
)

from paths import (
    derive_prepare_response_path,
    derive_process_request_path_pattern,
    derive_convert_response_path
)


def update_prescription(bundle_json, bundle_id, prescription_id, short_prescription_id, authored_on, signature_time):
    bundle_json["identifier"]["value"] = bundle_id
    for entry in bundle_json['entry']:
        resource = get_resource(entry)
        if resource["resourceType"] == "MessageHeader":
            message_type = resource["eventCoding"]["code"]
            break

    if (message_type == "dispense-notification"):
        update_dispense_notification(bundle_json, short_prescription_id, prescription_id, authored_on)

    if (message_type == "prescription-order" or message_type == "prescription-order-update"):
        update_prescription_order(bundle_json, signature_time, short_prescription_id, prescription_id, authored_on)


def update_dispense_notification(bundle_json, short_prescription_id, prescription_id, authored_on):
    entries = iter(bundle_json['entry'])
    resources = map(get_resource, entries)

    medication_dispenses = filter(get_medication_dispenses, resources)
    medication_dispenses = map(lambda resouce: update_handover(resouce, authored_on), medication_dispenses)

    authorizing_prescriptions = map(get_authorizing_prescriptions, medication_dispenses)

    extensions = map(get_extensions, authorizing_prescriptions)

    group_identifiers = filter(get_group_identifiers, extensions)

    extensions = map(get_extensions, group_identifiers)
    for extension in extensions:
        update_extension_url(extension, short_prescription_id, prescription_id)
        

def update_prescription_order(bundle_json, signature_time, short_prescription_id, prescription_id, authored_on):
    entries = iter(bundle_json['entry'])
    resources = map(get_resource, entries)
    for resource in resources:
        update_resource(resource, signature_time, short_prescription_id, prescription_id, authored_on)


def get_prepare_response_from_a_sandbox_api(api_base_url, prepare_request_json):
    return requests.post(
        f'{api_base_url}/{api_prefix_url}/$prepare',
        data=json.dumps(prepare_request_json),
        headers={'Content-Type': 'application/json', 'X-Request-ID': str(uuid.uuid4())}
    ).json()


def get_convert_response_from_a_sandbox_api(api_base_url, process_request_json):
    return requests.post(
        f'{api_base_url}/{api_prefix_url}/$convert',
        data=json.dumps(process_request_json),
        headers={'Content-Type': 'application/json', 'X-Request-ID': str(uuid.uuid4())}
    ).text


def update_prepare_examples(
    api_base_url, prepare_request_path, prepare_request_json, bundle_id, prescription_id, authored_on
):
    try:
        organisation_code = get_organisation_code(prepare_request_json)
        short_prescription_id = generate_short_form_id(organisation_code)
        update_prescription(prepare_request_json, bundle_id, prescription_id, short_prescription_id, authored_on, None)
        save_prepare_request(prepare_request_path, prepare_request_json)
        prepare_response_json = get_prepare_response_from_a_sandbox_api(api_base_url, prepare_request_json)
        prepare_response_path = derive_prepare_response_path(prepare_request_path)
        save_prepare_response(prepare_response_path, prepare_response_json)
        print(f"Updated prepare example for {prepare_request_path}")
        signature_time = get_signature_timestamp_from_prepare_response(prepare_response_json)
        return short_prescription_id, signature_time
    except BaseException as e:
        print(f"Failed to process example {prepare_request_path}")
        raise e


def update_process_examples(
    api_base_url, prepare_request_path, prescription_id, short_prescription_id, authored_on, signature_time
):
    try:
        process_request_path_pattern = derive_process_request_path_pattern(prepare_request_path)
        for process_request_path in glob.iglob(process_request_path_pattern):
            process_request_json = load_process_request(process_request_path)
            update_prescription(
                process_request_json, str(uuid.uuid4()), prescription_id, short_prescription_id,
                authored_on, signature_time
            )
            save_process_request(process_request_path, process_request_json)
            convert_response_xml = get_convert_response_from_a_sandbox_api(api_base_url, process_request_json)
            convert_response_path = derive_convert_response_path(process_request_path)
            save_convert_response(convert_response_path, convert_response_xml)
            print(f"Updated process and convert examples for {prepare_request_path}")
    except BaseException as e:
        print(f"Failed to process example {prepare_request_path}")
        raise e
