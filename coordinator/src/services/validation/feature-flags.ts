import {fhir} from "@models"

const prescriptionMessageTypes: Array<fhir.EventCodingCode> = [
  fhir.EventCodingCode.PRESCRIPTION, fhir.EventCodingCode.CANCELLATION
]

export function featureBlockedDispenseMessage(): boolean {
  return featureBlockedMessage(fhir.EventCodingCode.DISPENSE)
}

export function featureBlockedMessage(messageType: fhir.EventCodingCode): boolean {
  if (prescriptionMessageTypes.includes(messageType)) {
    return process.env.PRESCRIBE_ENABLED !== "true"
  }
  return process.env.DISPENSE_ENABLED !== "true"
}
