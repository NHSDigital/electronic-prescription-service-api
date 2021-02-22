import * as LosslessJson from "lossless-json"
import * as fhir from "../fhir"

export interface ValidationError {
  message: string
  operationOutcomeCode: "value"
  severity: "error" | "fatal"
  expression: Array<string>
}

export class MedicationRequestInconsistentValueError<T> implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string>

  constructor(fieldName: string, uniqueFieldValues: Array<T>) {
    this.message = `Expected all MedicationRequests to have the same value for ${
      fieldName
    }. Received ${
      LosslessJson.stringify(uniqueFieldValues)
    }.`
    this.expression = [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export class MedicationRequestDuplicateValueError<T> implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string>

  constructor(uniqueFieldValues: Array<T>) {
    this.message = `Expected all MedicationRequests to have a different value for identifier. Received ${
      uniqueFieldValues.length
    } unique values.`
    this.expression = [`Bundle.entry.resource.ofType(MedicationRequest).identifier`]
  }
}

export class MedicationRequestNumberError implements ValidationError {
  operationOutcomeCode = "value" as const
  severity = "error" as const
  message = "Expected exactly one MedicationRequest in a prescriptionOrderUpdate message"
  expression = ["Bundle.entry.resource.ofType(MedicationRequest)"]
}

export class MedicationRequestMissingValueError implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string>

  constructor(fieldName: string) {
    this.message = `Expected MedicationRequest to have a value for ${fieldName}`
    this.expression = [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export class MedicationRequestIncorrectValueError implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string>

  constructor(fieldName: string, requiredFieldValue: string) {
    this.message = `MedicationRequest.${fieldName} must be '${requiredFieldValue}'.`
    this.expression = [`Bundle.entry.resource.ofType(MedicationRequest).${fieldName}`]
  }
}

export class MessageTypeError implements ValidationError {
  message = `MessageHeader.eventCoding.code must be one of '${
    fhir.EventCodingCode.PRESCRIPTION
  }', '${
    fhir.EventCodingCode.CANCELLATION
  }' or '${
    fhir.EventCodingCode.DISPENSE
  }'.`
  operationOutcomeCode = "value" as const
  severity = "fatal" as const
  expression = ["Bundle.entry.resource.ofType(MessageHeader).eventCoding.code"]
}

export class ResourceTypeError implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string> = []

  constructor(expectedResourceType: string) {
    this.message = `Incorrect FHIR resource type. Expected ${expectedResourceType}.`
  }
}
