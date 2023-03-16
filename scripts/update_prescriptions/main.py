#!/usr/bin/env python
# coding: utf-8

"""
main.py

Usage:
  main.py API_BASE_URL
"""
import json
import os
import uuid
from datetime import date, datetime, timedelta
from docopt import docopt

from utils import find_prepare_request_paths
from fileio import load_json, load_prepare_request
from prescriptions import update_prepare_examples, update_process_examples
    

examples_root_dir = f"..{os.path.sep}examples{os.path.sep}"


def update_examples(api_base_url):
    authored_on = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S+00:00')
    for prepare_request_path in find_prepare_request_paths(examples_root_dir):
        prescription_id = str(uuid.uuid4())
        bundle_id = str(uuid.uuid4())
        prepare_request_json = load_prepare_request(prepare_request_path)
        short_prescription_id, signature_time = update_prepare_examples(
            api_base_url, prepare_request_path, prepare_request_json, bundle_id, prescription_id,
            authored_on
        )
        update_process_examples(
            api_base_url, prepare_request_path, prescription_id, short_prescription_id,
            authored_on, signature_time
        )


def main(arguments):
    update_examples(arguments["API_BASE_URL"])


if __name__ == "__main__":
    main(arguments=docopt(__doc__, version="0"))
