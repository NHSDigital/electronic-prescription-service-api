export interface ValidationError {
    message: string,
    operationOutcomeCode: "value",
    apiErrorCode: string,
    severity: "error" | "fatal"
}

export class EntryNumberError implements ValidationError{
  message: string
  operationOutcomeCode: "value"
  severity: "error"
  apiErrorCode: "MISSING_FIELD"

  constructor() {
    this.operationOutcomeCode = "value"
    this.severity = "error"
    this.apiErrorCode = "MISSING_FIELD"
  }
}

export class ContainsExactlyError extends EntryNumberError {
  message: string

  constructor(number: number, resourceType: string) {
    super()
    this.message = `Bundle must contain exactly ${number} resource(s) of type ${resourceType}`
  }
}

export class ContainsBetweenError extends EntryNumberError {
  message: string

  constructor(min: number, max: number, resourceType: string) {
    super()
    this.message = `Bundle must contain between ${min} and ${max} resource(s) of type ${resourceType}`
  }
}

export class ContainsAtLeastError extends EntryNumberError {
  message: string

  constructor(number: number, resourceType: string) {
    super()
    this.message = `Bundle must contain at least ${number} resource(s) of type ${resourceType}`
  }
}

export class MissingIdError extends EntryNumberError {
  message: string

  constructor() {
    super()
    this.message = "ResourceType Bundle must contain 'id' field"
  }
}

export class MedicationRequestValueError implements ValidationError {
  operationOutcomeCode: "value"
  severity: "error"
  message: string
  apiErrorCode: "INVALID_VALUE"

  constructor(fieldName: string, uniqueFieldValues: Array<string>) {
    this.operationOutcomeCode = "value"
    this.apiErrorCode = "INVALID_VALUE"
    this.severity = "error"
    this.message = `Expected all MedicationRequests to have the same value for ${fieldName}. Received ${[...uniqueFieldValues]}.`
  }
}

export class NoEntryInBundleError implements ValidationError {
  operationOutcomeCode: "value"
  severity: "fatal"
  apiErrorCode: "MISSING_FIELD"
  message: string

  constructor() {
    this.operationOutcomeCode = "value"
    this.severity = "fatal"
    this.apiErrorCode = "MISSING_FIELD"
    this.message = "ResourceType Bundle must contain 'entry' field"
  }
}

export class RequestNotBundleError implements ValidationError {
  operationOutcomeCode: "value"
  severity: "fatal"
  apiErrorCode: "INCORRECT_RESOURCETYPE"
  message: string

  constructor() {
    this.operationOutcomeCode = "value"
    this.severity = "fatal"
    this.apiErrorCode = "INCORRECT_RESOURCETYPE"
    this.message = "ResourceType must be 'Bundle' on request"
  }
}
