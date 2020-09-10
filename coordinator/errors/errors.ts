export interface ValidationError {
  message: string;
  operationOutcomeCode: "value";
  apiErrorCode: string;
  severity: "error" | "fatal";
}

class ValueError implements ValidationError {
  message: string;
  operationOutcomeCode = "value" as const;
  apiErrorCode = "MISSING_FIELD";
  severity = "error" as const;
}

export class ContainsExactlyError extends ValueError {
  constructor(number: number, resourceType: string) {
    super()
    this.message = `Bundle must contain exactly ${number} resource(s) of type ${resourceType}`
  }
}

export class ContainsBetweenError extends ValueError {
  constructor(min: number, max: number, resourceType: string) {
    super()
    this.message = `Bundle must contain between ${min} and ${max} resource(s) of type ${resourceType}`
  }
}

export class ContainsAtLeastError extends ValueError {
  constructor(number: number, resourceType: string) {
    super()
    this.message = `Bundle must contain at least ${number} resource(s) of type ${resourceType}`
  }
}

export class MissingIdError extends ValueError {
  constructor() {
    super()
    this.message = "ResourceType Bundle must contain 'id' field"
  }
}

export class MedicationRequestValueError extends ValueError {
  apiErrorCode = "INVALID_VALUE"

  constructor(fieldName: string, uniqueFieldValues: Array<string>) {
    super()
    this.message = `Expected all MedicationRequests to have the same value for ${fieldName}. Received ${[...uniqueFieldValues]}.`
  }
}

class FatalError implements ValidationError {
  operationOutcomeCode = "value" as const;
  severity = "fatal" as const;
  message: string;
  apiErrorCode: string;
}

export class NoEntryInBundleError extends FatalError{
  apiErrorCode: "MISSING_FIELD"

  constructor() {
    super()
    this.message = "ResourceType Bundle must contain 'entry' field"
  }
}

export class RequestNotBundleError extends FatalError{
  apiErrorCode = "INCORRECT_RESOURCETYPE"

  constructor() {
    super()
    this.message = "ResourceType must be 'Bundle' on request"
  }
}
