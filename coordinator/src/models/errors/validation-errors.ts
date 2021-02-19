import * as LosslessJson from "lossless-json"
import {EventCodingCode} from "../fhir/message-header"

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
    EventCodingCode.PRESCRIPTION
  }', '${
    EventCodingCode.CANCELLATION
  }' or '${
    EventCodingCode.DISPENSE
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
