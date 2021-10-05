import sys

from flask import session


def add_prepare_request(short_prescription_id, prepare_request):
    key = f'prepare_request_{short_prescription_id}'
    value = prepare_request
    print(f'saving {key}', file=sys.stderr)
    session[key] = value


def load_prepare_request(short_prescription_id):
    key = f'prepare_request_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def add_prepare_response(short_prescription_id, prepare_response):
    key = f'prepare_response_{short_prescription_id}'
    print(f'saving {key}', file=sys.stderr)
    session[key] = prepare_response


def contains_prepare_response(short_prescription_id):
    key = f'prepare_response_{short_prescription_id}'
    return key in session


def load_prepare_response(short_prescription_id):
    key = f'prepare_response_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def add_prescription_order_send_request(short_prescription_id, send_request):
    key = f'prescription_order_send_request_{short_prescription_id}'
    print(f'saving {key}', file=sys.stderr)
    session[key] = send_request


def contains_prescription_order_send_request(short_prescription_id):
    key = f'prescription_order_send_request_{short_prescription_id}'
    return key in session


def load_prescription_order_send_request(short_prescription_id):
    key = f'prescription_order_send_request_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]


def add_dispense_notification_send_request(short_prescription_id, request):
    key = f'dispense_notification_send_request_{short_prescription_id}'
    print(f'saving {key}', file=sys.stderr)
    if key not in session:
        session[key] = []
    session[key].append(request)


def contains_dispense_notification_send_requests(short_prescription_id):
    key = f'dispense_notification_send_request_{short_prescription_id}'
    return key in session


def load_dispense_notification_send_requests(short_prescription_id):
    key = f'dispense_notification_send_request_{short_prescription_id}'
    print(f'loading {key}', file=sys.stderr)
    return session[key]
