import {MessageType} from "../../routes/util"

export interface ValidationError {
  message: string
  operationOutcomeCode: "value"
  severity: "error" | "fatal"
  expression: Array<string>
}

export class MedicationRequestValueError implements ValidationError {
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const
  expression: Array<string>

  constructor(fieldName: string, uniqueFieldValues: Array<string>) {
    this.message = `Expected all MedicationRequests to have the same value for ${
      fieldName
    }. Received ${[
      ...uniqueFieldValues
    ]}.`
    this.expression = [`Bundle.entry.resource.ofType(MedicationRequests).${fieldName}`]
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
