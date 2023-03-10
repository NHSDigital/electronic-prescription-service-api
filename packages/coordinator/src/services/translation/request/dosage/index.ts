import {fhir} from "@models"
import {getNumericValueAsString, isTruthy} from "../../common"
import {toMap} from "../../../../utils/collections"
import pino from "pino"
import {DoseToTextMode, getDoseToTextMode} from "../../../../utils/feature-flags"

import stringifyMethod from "./stringifyMethod"
import stringifyDose from "./stringifyDose"
import stringifyRate from "./stringifyRate"
import stringifyDuration from "./stringifyDuration"
import stringifyFrequencyAndPeriod from "./stringifyFrequencyAndPeriod"
import stringifyOffsetAndWhen from "./stringifyOffsetAndWhen"
import stringifyDayOfWeekAndTimeOfDay from "./stringifyDayOfWeekAndTimeOfDay"
import stringifyRoute from "./stringifyRoute"
import stringifySite from "./stringifySite"
import stringifyAsNeeded from "./stringifyAsNeeded"
import stringifyBounds from "./stringifyBounds"
import stringifyCount from "./stringifyCount"
import stringifyEvent from "./stringifyEvent"
import stringifyMaxDosePerPeriod from "./stringifyMaxDosePerPeriod"
import stringifyMaxDosePerAdministration from "./stringifyMaxDosePerAdministration"
import stringifyMaxDosePerLifetime from "./stringifyMaxDosePerLifetime"
import stringifyAdditionalInstruction from "./stringifyAdditionalInstruction"
import stringifyPatientInstruction from "./stringifyPatientInstruction"

export function auditDoseToTextIfEnabled(dosages: Array<fhir.Dosage>, logger: pino.Logger): void {
  if (getDoseToTextMode(logger) === DoseToTextMode.AUDIT) {
    try {
      logger.info(
        {
          dosageInstructionText: stringifyDosages(dosages),
          dosageInstruction: dosages
        },
        "Auditing dose to text conversion"
      )
    } catch (e) {
      logger.error(e, "Dose to text conversion failed")
    }
  }
}

function stringifyDosages(dosages: Array<fhir.Dosage>): string {
  if (!dosages?.length) {
    return ""
  }

  if (dosages.length === 1) {
    return stringifyDosage(dosages[0])
  }

  const sequences = dosages.map(dosage => dosage.sequence)
  if (!sequences.every(isTruthy)) {
    throw new Error("Multiple dosage instructions but sequence not specified")
  }

  const sequenceToDosageStrings = toMap(dosages, getSequenceNumber, stringifyDosage)
  const sortedSequences = Array.from(sequenceToDosageStrings.keys()).sort(compareNumbers)
  const sequentialConcurrentInstructions = sortedSequences.map(sequence => sequenceToDosageStrings.get(sequence))
  const sequentialInstructions = sequentialConcurrentInstructions.map(instructions => instructions.join(", and "))
  return sequentialInstructions.join(", then ")
}

function getSequenceNumber(dosage: fhir.Dosage) {
  const sequenceStr = getNumericValueAsString(dosage.sequence)
  return parseInt(sequenceStr)
}

function compareNumbers(a: number, b: number) {
  return Math.sign(a - b)
}

function getHeadAndTail<T>(array: Array<T>): [T, Array<T>] {
  const arrayShallowCopy = [...array]
  return [arrayShallowCopy.shift(), arrayShallowCopy]
}

function stringifyDosage(dosage: fhir.Dosage): string {
  const dosageParts: Array<Array<string>> = [
    stringifyMethod(dosage),
    stringifyDose(dosage),
    stringifyRate(dosage),
    stringifyDuration(dosage),
    stringifyFrequencyAndPeriod(dosage),
    stringifyOffsetAndWhen(dosage),
    stringifyDayOfWeekAndTimeOfDay(dosage),
    stringifyRoute(dosage),
    stringifySite(dosage),
    stringifyAsNeeded(dosage),
    stringifyBounds(dosage),
    stringifyCount(dosage),
    stringifyEvent(dosage),
    stringifyMaxDosePerPeriod(dosage),
    stringifyMaxDosePerAdministration(dosage),
    stringifyMaxDosePerLifetime(dosage),
    stringifyAdditionalInstruction(dosage),
    stringifyPatientInstruction(dosage)
  ]
  if (dosageParts.some(part => part?.some(element => !element))) {
    console.error(dosageParts)
    throw new Error("Null or undefined dosage element - required field not populated.")
  }
  const stringifiedParts = dosageParts.map(part => part?.join(""))
  const [stringifiedMethod, stringifiedOtherParts] = getHeadAndTail(stringifiedParts)
  const joinedStringifiedOtherParts = stringifiedOtherParts.filter(isTruthy).join(" - ")
  return [stringifiedMethod, joinedStringifiedOtherParts].filter(isTruthy).join(" ")
}

export {
  stringifyDosage, stringifyDosages
}
