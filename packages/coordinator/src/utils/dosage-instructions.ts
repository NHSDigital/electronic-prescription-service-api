import {fhir} from "@models"
import {pino} from "pino"
import {auditDoseToTextIfEnabled} from "../services/translation/request/dosage"

type concurrentDosages = Array<fhir.Dosage>
type sequentialDosages = Array<concurrentDosages>

export function getDosageInstructionFromMedicationDispense(
  fhirMedicationDispense: fhir.MedicationDispense,
  logger: pino.Logger
): string {
  auditDoseToTextIfEnabled(fhirMedicationDispense.dosageInstruction, logger)

  const dosageInstructions = fhirMedicationDispense.dosageInstruction
  return getDosageInstruction(dosageInstructions)
}

export function getDosageInstruction(dosageInstructions: Array<fhir.Dosage>): string {
  if (dosageInstructions.length === 1) {
    return dosageInstructions[0].text
  }

  if (dosageInstructions.some((dosage) => !dosage.sequence)) {
    throw new Error("Dosage instructions lacking complete sequencing")
  }

  const sequencedDosageInstructions = sequenceDosageInstructions(dosageInstructions)
  const stringifiedConcurrentDosages = sequencedDosageInstructions.map(stringifyConcurrentDosages)
  const stringifiedConsecutiveDosages = stringifiedConcurrentDosages[0]
    ? stringifiedConcurrentDosages.join(", then ")
    : stringifiedConcurrentDosages.slice(1).join(", then ")

  return stringifiedConsecutiveDosages
}

function sequenceDosageInstructions(dosageInstructions: Array<fhir.Dosage>): sequentialDosages {
  return dosageInstructions.reduce((sequencedDosages: sequentialDosages, dosage) => {
    const dosageSequence = getDosageSequenceAsIndex(dosage)
    if (!sequencedDosages[dosageSequence]) {
      sequencedDosages[dosageSequence] = [dosage]
    } else {
      sequencedDosages[dosageSequence].push(dosage)
    }
    return sequencedDosages
  }, [])
}

function getDosageSequenceAsIndex(dosage: fhir.Dosage): number {
  const parsedNumber = Number(dosage.sequence.valueOf())
  return isNaN(parsedNumber) ? null : parsedNumber
}

function stringifyConcurrentDosages(concurrentDosages: concurrentDosages): string {
  return concurrentDosages.map(getDosageText).join(", and ")
}

function getDosageText(dosage: fhir.Dosage): string {
  return dosage.text
}
