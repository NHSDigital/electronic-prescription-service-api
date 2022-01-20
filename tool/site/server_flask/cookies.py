import datetime
import flask
import config

HAPI_SESSION_COOKIE_NAME = "session"


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

def get_auth_level_from_cookie():
    return flask.request.cookies.get("Auth-Level")

def set_auth_level_cookie(response, auth_level):
    response.set_cookie(
        "Auth-Level",
        auth_level,
        expires=datetime.datetime.utcnow() + datetime.timedelta(days=1),
        secure=not config.DEV_MODE,
        httponly=False,
    )


def set_session_cookie(response, session_cookie, expiry):
    response.set_cookie(
        HAPI_SESSION_COOKIE_NAME,
        session_cookie,
        expires=expiry,
        secure=not config.DEV_MODE,
        httponly=True
    )


def get_session_cookie():
    return flask.request.cookies.get(HAPI_SESSION_COOKIE_NAME)
