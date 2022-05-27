import json
from enum import Enum
from typing import Any, List

import tornado

from request import content_type_validator
from request.http_headers import HttpHeaders
from request.tracking_ids_headers_reader import read_tracking_id_headers
from utilities import mdc, message_utilities


class ErrorHandler(tornado.web.RequestHandler):

    def initialize(self) -> None:
        mdc.trace_id.set(message_utilities.get_uuid())

    def prepare(self):
        raise tornado.web.HTTPError(
            status_code=404,
            log_message="Invalid resource path.")

    def write_error(self, status_code: int, **kwargs: Any) -> None:
        read_tracking_id_headers(self.request.headers, raise_error=False)

        operation_outcome = None
        additional_headers = []
        if status_code == 400:
            _, exception, _ = kwargs['exc_info']
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.required, [SpineCodings.BAD_REQUEST],
                                                        diagnostics=str(exception))])
        elif status_code == 404:
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.not_found, [SpineCodings.NO_RECORD_FOUND],
                                                        diagnostics="HTTP endpoint not found")])
        elif status_code == 405:
            additional_headers.append(("Allow", "GET"))
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.not_supported, [SpineCodings.NOT_IMPLEMENTED],
                                                        diagnostics="HTTP operation not supported")])
        elif status_code == 406:
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.not_supported, [SpineCodings.MISSING_OR_INVALID_HEADER],
                                                        diagnostics="Accept type not supported")])
        elif status_code == 500:
            _, exception, _ = kwargs['exc_info']
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.exception, [SpineCodings.INTERNAL_SERVER_ERROR],
                                                        diagnostics=str(exception))])
        elif status_code == 502:
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.exception, [SpineCodings.INTERNAL_SERVER_ERROR],
                                                        diagnostics="Invalid LDAP response received")])
        elif status_code == 504:
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.timeout, [SpineCodings.INTERNAL_SERVER_ERROR],
                                                        diagnostics="LDAP request timed out")])
        elif 400 <= status_code <= 499:
            _, exception, _ = kwargs['exc_info']
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.exception, [SpineCodings.BAD_REQUEST],
                                                        diagnostics=str(exception))])
        elif 500 <= status_code < 599:
            _, exception, _ = kwargs['exc_info']
            operation_outcome = OperationOutcome([Issue(Severity.error, Code.exception, [SpineCodings.INTERNAL_SERVER_ERROR],
                                                        diagnostics=str(exception))])

        self.set_header(HttpHeaders.X_CORRELATION_ID, mdc.correlation_id.get())
        if operation_outcome is not None:
            operation_outcome.id = str(mdc.correlation_id.get())
            content_type = content_type_validator.APPLICATION_FHIR_JSON
            serialized = operation_outcome.to_json()
            self.set_header(HttpHeaders.CONTENT_TYPE, content_type)
            [self.set_header(kv[0], kv[1]) for kv in additional_headers]
            self.write(serialized)
        else:
            super().write_error(status_code, **kwargs)


class Coding:
    def __init__(self, system: str, code: str, display: str):
        self.system = system
        self.code = code
        self.display = display

    def to_dict(self):
        return {
            "system": self.system,
            "code": self.code,
            "display": self.display
        }


class SpineCoding(Coding):
    SPINE_SYSTEM = "https://fhir.nhs.uk/STU3/ValueSet/Spine-ErrorOrWarningCode-1"

    def __init__(self, code, display):
        super().__init__(SpineCoding.SPINE_SYSTEM, code, display)


class Severity(Enum):
    fatal = "fatal"
    error = "error"
    warning = "warning"
    information = "information"


class Code(Enum):
    invalid = "invalid"
    structure = "structure"
    required = "required"
    value = "value"
    invariant = "invariant"
    security = "security"
    login = "login"
    unknown = "unknown"
    expired = "expired"
    forbidden = "forbidden"
    suppressed = "suppressed"
    processing = "processing"
    not_supported = "not-supported"
    duplicate = "duplicate"
    multiple_matches = "multiple-matches"
    not_found = "not-found"
    deleted = "deleted"
    too_long = "too-long"
    code_invalid = "code-invalid"
    extension = "extension"
    too_costly = "too-costly"
    business_rule = "business-rule"
    conflict = "conflict"
    transient = "transient"
    lock_error = "lock-error"
    no_store = "no-store"
    exception = "exception"
    timeout = "timeout"
    incomplete = "incomplete"
    throttled = "throttled"
    informational = "informational"


class Codings(Enum):
    pass


class SpineCodings(Codings):
    ACCESS_DENIED = SpineCoding("ACCESS_DENIED", "Access has been denied to process this request")
    ACCESS_DENIED_SSL = SpineCoding("ACCESS_DENIED_SSL", "SSL Protocol or Cipher requirements not met")
    ASID_CHECK_FAILED = SpineCoding("ASID_CHECK_FAILED", "The sender or receiver's ASID is not authorised for this interaction")
    AUTHOR_CREDENTIALS_ERROR = SpineCoding("AUTHOR_CREDENTIALS_ERROR", "Author credentials error")
    BAD_REQUEST = SpineCoding("BAD_REQUEST", "Bad request")
    CONFLICTING_VALUES = SpineCoding("CONFLICTING_VALUES", "Conflicting values have been specified in different fields")
    DUPLICATE_REJECTED = SpineCoding("DUPLICATE_REJECTED", "Create would lead to creation of a duplicate resource")
    FHIR_CONSTRAINT_VIOLATION = SpineCoding("FHIR_CONSTRAINT_VIOLATION", "FHIR constraint violated")
    FLAG_ALREADY_SET = SpineCoding("FLAG_ALREADY_SET", "Flag value was already set")
    INTERNAL_SERVER_ERROR = SpineCoding("INTERNAL_SERVER_ERROR", "Unexpected internal server error")
    INVALID_CODE_SYSTEM = SpineCoding("INVALID_CODE_SYSTEM", "Invalid code system")
    INVALID_CODE_VALUE = SpineCoding("INVALID_CODE_VALUE", "Invalid code value")
    INVALID_ELEMENT = SpineCoding("INVALID_ELEMENT", "Invalid element")
    INVALID_IDENTIFIER_SYSTEM = SpineCoding("INVALID_IDENTIFIER_SYSTEM", "Invalid identifier system")
    INVALID_IDENTIFIER_VALUE = SpineCoding("INVALID_IDENTIFIER_VALUE", "Invalid identifier value")
    INVALID_NHS_NUMBER = SpineCoding("INVALID_NHS_NUMBER", "Invalid NHS number")
    INVALID_PARAMETER = SpineCoding("INVALID_PARAMETER", "Invalid parameter")
    INVALID_PATIENT_DEMOGRAPHICS = SpineCoding("INVALID_PATIENT_DEMOGRAPHICS", "Invalid patient demographics")
    INVALID_REQUEST_MESSAGE = SpineCoding("INVALID_REQUEST_MESSAGE", "Invalid request message")
    INVALID_REQUEST_STATE = SpineCoding("INVALID_REQUEST_STATE", "The request exists but is not in an appropriate state for the call to succeed")
    INVALID_REQUEST_TYPE = SpineCoding("INVALID_REQUEST_TYPE", "The type of request is not supported by the API call")
    INVALID_RESOURCE = SpineCoding("INVALID_RESOURCE", "Invalid validation of resource")
    INVALID_VALUE = SpineCoding("INVALID_VALUE", "An input field has an invalid value for its type")
    MESSAGE_NOT_WELL_FORMED = SpineCoding("MESSAGE_NOT_WELL_FORMED", "Message not well formed")
    MISSING_OR_INVALID_HEADER = SpineCoding("MISSING_OR_INVALID_HEADER", "There is a required header missing or invalid")
    MSG_RESOURCE_ID_FAIL = SpineCoding("MSG_RESOURCE_ID_FAIL", "Client is not permitted to assign an id")
    NOT_IMPLEMENTED = SpineCoding("NOT_IMPLEMENTED", "Not implemented")
    NO_ORGANISATIONAL_CONSENT = SpineCoding("NO_ORGANISATIONAL_CONSENT", "Organisation has not provided consent to share data")
    NO_PATIENT_CONSENT = SpineCoding("NO_PATIENT_CONSENT", "Patient has not provided consent to share data")
    NO_RECORD_FOUND = SpineCoding("NO_RECORD_FOUND", "No record found")
    NO_RELATIONSHIP = SpineCoding("NO_RELATIONSHIP", "No legitimate relationship exists with this patient")
    ORGANISATION_NOT_FOUND = SpineCoding("ORGANISATION_NOT_FOUND", "Organisation not found")
    PATIENT_NOT_FOUND = SpineCoding("PATIENT_NOT_FOUND", "Patient not found")
    PATIENT_SENSITIVE = SpineCoding("PATIENT_SENSITIVE", "Patient sensitive")
    PRACTITIONER_NOT_FOUND = SpineCoding("PRACTITIONER_NOT_FOUND", "Practitioner not found")
    REFERENCE_NOT_FOUND = SpineCoding("REFERENCE_NOT_FOUND", "Reference not found")
    REQUEST_UNMATCHED = SpineCoding("REQUEST_UNMATCHED", "Request does not match authorisation token")
    RESOURCE_CREATED = SpineCoding("RESOURCE_CREATED", "New resource created")
    RESOURCE_DELETED = SpineCoding("RESOURCE_DELETED", "Resource removed")
    RESOURCE_UPDATED = SpineCoding("RESOURCE_UPDATED", "Resource has been successfully updated")


class Issue:
    def __init__(self, severity: Severity, code: Code, codings: List[Codings], diagnostics: str = None):
        self.severity = severity
        self.code = code
        self.codings = codings
        self.diagnostics = diagnostics

    def to_dict(self):
        issue = {
            "severity": self.severity.value,
            "code": self.code.value,
            "details": {
                "coding": [coding.value.to_dict() for coding in self.codings]
            }
        }
        if self.diagnostics is not None:
            issue["diagnostics"] = self.diagnostics
        return issue


class OperationOutcome:
    def __init__(self, issues: List[Issue], id: str = None):
        self.id = id
        self.issues = issues

    def _to_dict(self):
        operation_outcome = {
            "resourceType": "OperationOutcome"
        }
        if self.id is not None:
            operation_outcome["id"] = self.id
        operation_outcome["issue"] = [issue.to_dict() for issue in self.issues]
        return operation_outcome

    def to_json(self):
        return json.dumps(self._to_dict(), indent=4)
