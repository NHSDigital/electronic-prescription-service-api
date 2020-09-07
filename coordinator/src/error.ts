import {OperationOutcome} from "./model/fhir-resources"

export class UserFacingError extends Error {
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

export class InvalidValueUserFacingError extends UserFacingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("INVALID_VALUE", userErrorDesc, userErrorFhirPath)
  }
}

export class TooFewValuesUserFacingError extends UserFacingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("TOO_FEW_VALUES_SUBMITTED", userErrorDesc, userErrorFhirPath)
  }
}

export class TooManyValuesUserFacingError extends UserFacingError {
  constructor(userErrorDesc: string, userErrorFhirPath?: string) {
    super("TOO_MANY_VALUES_SUBMITTED", userErrorDesc, userErrorFhirPath)
  }
}

export function toOperationOutcome(response: UserFacingError): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
          code: response.userErrorCode,
          display: response.userErrorMessage
        }]
      },
      expression: response.userErrorFhirPath
    }]
  }
}
