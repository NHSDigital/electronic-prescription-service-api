import {MessageType} from "../../routes/util"

export interface ValidationError {
  message: string
  operationOutcomeCode: "value"
  apiErrorCode: string
  severity: "error" | "fatal"
}

export class MedicationRequestValueError implements ValidationError {
  apiErrorCode = "INVALID_VALUE"
  message: string
  operationOutcomeCode = "value" as const
  severity = "error" as const

  constructor(fieldName: string, uniqueFieldValues: Array<string>) {
    this.message = `Expected all MedicationRequests to have the same value for ${
      fieldName
    }. Received ${[
      ...uniqueFieldValues
    ]}.`
  }
}

export class MessageTypeError implements ValidationError {
  operationOutcomeCode = "value" as const
  severity = "fatal" as const
  apiErrorCode = "INVALID_VALUE"
  message = `MessageHeader.eventCoding.code must be one of '${
    MessageType.PRESCRIPTION
  }' or '${
    MessageType.CANCELLATION
  }'.`
}
