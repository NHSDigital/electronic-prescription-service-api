import datetime
import flask
import config


def get_current_prescription_id_from_cookie():
    return flask.request.cookies.get("Current-Prescription-Id")


def set_previous_prescription_id_cookie(response, short_prescription_id):
    response.set_cookie(
        "Previous-Prescription-Id",
        short_prescription_id,
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=False,
    )


def reset_previous_prescription_id_cookie(response):
    response.set_cookie("Previous-Prescription-Id", "", expires=0, secure=not config.DEV_MODE, httponly=True)


def set_current_prescription_id_cookie(response, short_prescription_id):
    response.set_cookie(
        "Current-Prescription-Id",
        short_prescription_id,
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=False,
    )


def set_next_prescription_id_cookie(response, short_prescription_id):
    response.set_cookie(
        "Next-Prescription-Id",
        short_prescription_id,
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=False,
    )


def reset_next_prescription_id_cookie(response):
    response.set_cookie("Next-Prescription-Id", "", expires=0, secure=not config.DEV_MODE, httponly=True)


def set_prescription_ids_cookie(response, prescription_ids):
    separator = "|"
    response.set_cookie(
        "Prescription-Ids",
        separator.join(prescription_ids),
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=True,
    )


def get_all_prescription_ids_from_cookie():
    return flask.request.cookies.get("Prescription-Ids", "").split("|")


def get_auth_method_from_cookie():
    return flask.request.cookies.get("Auth-Method", "cis2")


def set_auth_method_cookie(response, auth_method):
    response.set_cookie(
        "Auth-Method",
        auth_method,
        expires=datetime.datetime.utcnow() + datetime.timedelta(days=1),
        secure=not config.DEV_MODE,
        httponly=True,
    )



def set_skip_signature_page_cookie(response, skip_signature_page):
    response.set_cookie(
        "Skip-Signature-Page",
        skip_signature_page,
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=False,
    )


def set_session_cookie(response, session_cookie_value):
    response.set_cookie(
        "session",
        session_cookie_value,
        expires=datetime.datetime.utcnow() + datetime.timedelta(seconds=float(600)),
        secure=not config.DEV_MODE,
        httponly=True
    )


def get_session_cookie_value():
    return flask.request.cookies.get("session")