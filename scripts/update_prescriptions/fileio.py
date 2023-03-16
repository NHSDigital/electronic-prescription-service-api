import json


def load_dispense_request(dispense_request_path):
    return load_json(dispense_request_path)


def load_prepare_request(prepare_request_path):
    return load_json(prepare_request_path)


def load_process_request(process_request_path):
    return load_json(process_request_path)


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_dispense_request(dispense_request_path, dispense_request_json):
    save_json(dispense_request_path, dispense_request_json)


def save_prepare_request(prepare_request_path, prepare_request_json):
    save_json(prepare_request_path, prepare_request_json)


def save_prepare_response(prepare_response_path, prepare_response_json):
    save_json(prepare_response_path, prepare_response_json)


def save_process_request(process_request_path, process_request_json):
    save_json(process_request_path, process_request_json)


def save_convert_response(convert_response_path, convert_response_xml):
    save_xml(convert_response_path, convert_response_xml)


def save_json(path, body):
    with open(path, 'w', newline='\n') as f:
        json.dump(body, f, ensure_ascii=False, indent=2)


def save_xml(path, body):
    with open(path, 'w', newline='\n') as f:
        f.write(body)
