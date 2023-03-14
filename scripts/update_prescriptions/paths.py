import os


def get_example_dir_and_filename_parts(request_path):
    example_dir = os.path.dirname(request_path)
    filename = os.path.basename(request_path)
    return example_dir, filename.split('-')


def derive_prepare_response_path(prepare_request_path):
    example_dir, filename_parts = get_example_dir_and_filename_parts(prepare_request_path)
    number = filename_parts[0]
    status_code_and_ext = filename_parts[-1]
    return f'{example_dir}{os.path.sep}{number}-Prepare-Response-{status_code_and_ext}'


def derive_process_request_path_pattern(prepare_request_path):
    example_dir, filename_parts = get_example_dir_and_filename_parts(prepare_request_path)
    number = filename_parts[0]
    status_code_and_ext = filename_parts[-1]
    return f'{example_dir}{os.path.sep}{number}-Process-Request-*-{status_code_and_ext}'


def derive_convert_response_path(process_request_path):
    example_dir, filename_parts = get_example_dir_and_filename_parts(process_request_path)
    number = filename_parts[0]
    operation = filename_parts[3]
    status_code_and_ext = filename_parts[-1]
    status_code_and_xml_ext = status_code_and_ext.replace("json", "xml")
    return f'{example_dir}{os.path.sep}{number}-Convert-Response-{operation}-{status_code_and_xml_ext}'


def derive_dispense_request_path(process_request_path):
    example_dir, filename_parts = get_example_dir_and_filename_parts(process_request_path)
    number = filename_parts[0]
    status_code_and_ext = filename_parts[-1]
    return f'{example_dir}{os.path.sep}{number}-Process-Request-Dispense-{status_code_and_ext}'
