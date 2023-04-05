import {fhir} from "@models"
import {pino} from "pino"
import {auditDoseToTextIfEnabled} from "../request/dosage"
import {toMap} from "../../../../src/utils/collections"

export function getDosageInstructionFromMedicationDispense(
  fhirMedicationDispense: fhir.MedicationDispense,
  logger: pino.Logger
): string {
  auditDoseToTextIfEnabled(fhirMedicationDispense.dosageInstruction, logger)

  const dosageInstructions = fhirMedicationDispense.dosageInstruction
  return getDosageInstruction(dosageInstructions)
}

export function getDosageInstruction(dosageInstructions: Array<fhir.Dosage>): string {
  if (!dosageInstructions) {
    throw new Error("Dosage instructions not provided")
  }

  if (dosageInstructions.length === 1) {
    return dosageInstructions[0].text
  }

  if (dosageInstructions.some((dosage) => !dosage.sequence)) {
    throw new Error("Dosage instructions lacking complete sequencing")
  }

  const sequenceToDosageStrings = toMap(dosageInstructions, getSequenceNumber, getDosageText)
  const sortedSequences = Array.from(sequenceToDosageStrings.keys()).sort(ascSort)
  const sequentialConcurrentInstructions = sortedSequences.map((sequence) => sequenceToDosageStrings.get(sequence))
  const sequentialInstructions = sequentialConcurrentInstructions.map((instructions) => instructions.join(", and "))
  return sequentialInstructions.join(", then ")
}

function ascSort(a: number, b: number) {
  return Math.sign(a - b)
}

function getSequenceNumber(dosage: fhir.Dosage) {
  return dosage.sequence.valueOf() as number
}
function getDosageText(dosage: fhir.Dosage): string {
  return dosage.text
}
