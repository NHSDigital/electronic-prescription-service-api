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

export function getDoseToTextMode(): DoseToTextMode {
  const mode = process.env.DOSE_TO_TEXT_MODE
  if (mode in DoseToTextMode) {
    return mode as DoseToTextMode
  }
  return DoseToTextMode.DISABLED
}

export enum DoseToTextMode {
  DISABLED = "DISABLED",
  AUDIT = "AUDIT"
}
