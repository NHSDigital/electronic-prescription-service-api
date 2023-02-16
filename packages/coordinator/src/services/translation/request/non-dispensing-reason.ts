import {hl7V3, processingErrors} from "@models"
import {NonDispensingReason} from "../../../../../models/hl7-v3"

export function mapNonDispensingReason(fhirNonDispensingReasonCode: string): hl7V3.NonDispensingReason {
  const codeMap: Record<string, string> = {
    "0001": "0010",
    "0002": "XXXX",
    "0003": "XXXX",
    "0004": "XXXX",
    "0005": "XXXX",
    "0006": "XXXX",
    "0007": "XXXX",
    "0008": "0008"
  }
  const mappedCode = codeMap[fhirNonDispensingReasonCode]
  const validMappings = ["0008", "0010"]
  if (validMappings.includes(mappedCode)) {
    return new NonDispensingReason(mappedCode)
  } else {
    throw new processingErrors.InvalidValueError(
      "Unable to map fhirMedicationDispense.extension:NonDispensingReason to hl7 v3 equivalent."
    )
  }
}
