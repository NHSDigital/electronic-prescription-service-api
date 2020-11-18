import {MessageType} from "../../routes/util"
import * as LosslessJson from "lossless-json"

export interface ValidationError {
  message: string
  operationOutcomeCode: "value"
  severity: "error" | "fatal"
  expression: Array<string>
}

export class MedicationRequestValueError<T> implements ValidationError {
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

export class MessageTypeError implements ValidationError {
  message = `MessageHeader.eventCoding.code must be one of '${
    MessageType.PRESCRIPTION
  }' or '${
    MessageType.CANCELLATION
  }'.`
  operationOutcomeCode = "value" as const
  severity = "fatal" as const
  expression = ["Bundle.entry.resource.ofType(MessageHeader).eventCoding.code"]
}
