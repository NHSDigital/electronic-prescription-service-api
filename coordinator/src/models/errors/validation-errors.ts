import * as LosslessJson from "lossless-json"
import * as fhir from "../fhir"

export function createMedicationRequestInconsistentValueError<T>(
  fieldName: string,
  uniqueFieldValues: Array<T>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Expected all MedicationRequests to have the same value for ${
      fieldName
    }. Received ${
      LosslessJson.stringify(uniqueFieldValues)
    }.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export const medicationRequestDuplicateIdentifierError: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: "value",
  diagnostics: "Expected all MedicationRequests to have a different value for identifier.",
  expression: ["Bundle.entry.resource.ofType(MedicationRequest).identifier"]
}

export const medicationRequestNumberError: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: "value",
  diagnostics: `The Bundle must contain exactly one MedicationRequest if MessageHeader.eventCoding.code is '${
    fhir.EventCodingCode.CANCELLATION
  }'.`,
  expression: ["Bundle.entry.resource.ofType(MedicationRequest)"]
}

export function createMedicationRequestMissingValueError(fieldName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Expected MedicationRequest to have a value for ${fieldName}.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export function createMedicationRequestIncorrectValueError(
  fieldName: string,
  requiredFieldValue: string
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `MedicationRequest.${fieldName} must be '${requiredFieldValue}'.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export const messageTypeIssue: fhir.OperationOutcomeIssue = {
  severity: "fatal",
  code: "value",
  diagnostics: `MessageHeader.eventCoding.code must be one of '${
    fhir.EventCodingCode.PRESCRIPTION
  }', '${
    fhir.EventCodingCode.CANCELLATION
  }' or '${
    fhir.EventCodingCode.DISPENSE
  }'.`,
  expression: ["Bundle.entry.resource.ofType(MessageHeader).eventCoding.code"]
}

export function createResourceTypeIssue(expectedResourceType: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: "value",
    diagnostics: `Incorrect FHIR resource type. Expected ${expectedResourceType}.`
  }
}
