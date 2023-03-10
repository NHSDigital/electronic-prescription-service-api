import {fhir} from "@models"

export default function stringifyPatientInstruction(dosage: fhir.Dosage): Array<string> {
  if (!dosage.patientInstruction) {
    return []
  }
  return [dosage.patientInstruction]
}
