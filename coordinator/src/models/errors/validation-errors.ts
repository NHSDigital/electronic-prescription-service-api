import * as LosslessJson from "lossless-json"
import * as fhir from "../fhir"

export const messageTypeIssue: fhir.OperationOutcomeIssue = {
  severity: "fatal",
  code: "value",
  diagnostics: `MessageHeader.eventCoding.code must be one of: ${fhir.ACCEPTED_MESSAGE_TYPES.join(", ")}.`,
  expression: ["Bundle.entry.resource.ofType(MessageHeader).eventCoding.code"]
}

export function createMedicationRequestInconsistentValueIssue<T>(
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

export const medicationRequestDuplicateIdentifierIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: "value",
  diagnostics: "Expected all MedicationRequests to have a different value for identifier.",
  expression: ["Bundle.entry.resource.ofType(MedicationRequest).identifier"]
}

export function createMedicationDispenseInconsistentValueIssue<T>(
  fieldName: string,
  uniqueFieldValues: Array<T>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Expected all MedicationDispenses to have the same value for ${
      fieldName
    }. Received ${
      LosslessJson.stringify(uniqueFieldValues)
    }.`,
    expression: [`Bundle.entry.resource.ofType(MedicationDispense).${fieldName}`]
  }
}

export const medicationRequestNumberIssue: fhir.OperationOutcomeIssue = {
  severity: "error",
  code: "value",
  diagnostics: `The Bundle must contain exactly one MedicationRequest if MessageHeader.eventCoding.code is '${
    fhir.EventCodingCode.CANCELLATION
  }'.`,
  expression: ["Bundle.entry.resource.ofType(MedicationRequest)"]
}

export function createMedicationRequestMissingValueIssue(fieldName: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Expected MedicationRequest to have a value for ${fieldName}.`,
    expression: [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export function createMedicationRequestIncorrectValueIssue(
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

export function createResourceTypeIssue(expectedResourceType: string): fhir.OperationOutcomeIssue {
  return {
    severity: "fatal",
    code: "value",
    diagnostics: `Incorrect FHIR resource type. Expected ${expectedResourceType}.`
  }
}

export function createTaskIncorrectValueIssue(
  fieldName: string,
  ...allowedFieldValues: Array<string>
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Task.${fieldName} must be one of: ${allowedFieldValues.map(v => "'" + v + "'").join(", ")}.`,
    expression: [`Task.${fieldName}`]
  }
}

export function createTaskCodingSystemIssue(
  fieldName: string,
  requiredSystem: string
): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: "value",
    diagnostics: `Task.${fieldName} must have a system of '${requiredSystem}' and a value from that system.`,
    expression: [`Task.${fieldName}`]
  }
}
