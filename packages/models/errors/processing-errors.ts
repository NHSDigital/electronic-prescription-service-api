import * as fhir from "../fhir"

export class FhirMessageProcessingError extends Error {
  message: string
  userErrorCode: string
  userErrorMessage: string
  userErrorFhirPath: string
  constructor(userErrorCode: string, userErrorDesc: string, userErrorFhirPath?: string) {
    super(userErrorDesc)
    this.userErrorCode = userErrorCode
    this.userErrorMessage = userErrorDesc
    this.userErrorFhirPath = userErrorFhirPath
  }
}

export class InconsistentValuesError extends FhirMessageProcessingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("INVALID_VALUE", userErrorDesc, userErrorFhirPath)
  }
}

export class InvalidValueError extends FhirMessageProcessingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("INVALID_VALUE", userErrorDesc, userErrorFhirPath)
  }
}

export class TooFewValuesError extends FhirMessageProcessingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("TOO_FEW_VALUES_SUBMITTED", userErrorDesc, userErrorFhirPath)
  }
}

export class TooManyValuesError extends FhirMessageProcessingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("TOO_MANY_VALUES_SUBMITTED", userErrorDesc, userErrorFhirPath)
  }
}

export function toOperationOutcomeFatal(response: FhirMessageProcessingError): fhir.OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: fhir.IssueCodes.INVALID,
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
          code: response.userErrorCode,
          display: response.userErrorMessage
        }]
      },
      expression: [response.userErrorFhirPath]
    }]
  }
}

export function toOperationOutcomeError(response: InconsistentValuesError): fhir.OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "error",
      code: fhir.IssueCodes.INVALID,
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
          code: response.userErrorCode
        }]
      },
      expression: [response.userErrorFhirPath],
      diagnostics: response.userErrorMessage
    }]
  }
}
