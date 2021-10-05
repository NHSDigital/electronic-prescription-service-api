import json
import base64
import sys
from flask import session


def add_prepare_request(short_prescription_id, prepare_request):
    key = f'prepare_request_{short_prescription_id}'
    value = prepare_request
    print(f'saving {key}', file=sys.stderr)
    session[key] = value


def add_prepare_response(short_prescription_id, prepare_response):
    key = f'prepare_response_{short_prescription_id}'
    print(f'saving {key}', file=sys.stderr)
    session[key] = prepare_response


def add_send_request(short_prescription_id, send_request):
    key = f'send_request_{short_prescription_id}'
    print(f'saving {key}', file=sys.stderr)
    session[key] = send_request


def load_prepare_request(short_prescription_id):
    key = f'prepare_request_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def load_prepare_response(short_prescription_id):
    key = f'prepare_response_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def contains_prepare_response(short_prescription_id):
    key = f'prepare_response_{short_prescription_id}'
    return key in session


def load_send_request(short_prescription_id):
    key = f'send_request_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def contains_send_request(short_prescription_id):
    key = f'send_request_{short_prescription_id}'
    return key in session
