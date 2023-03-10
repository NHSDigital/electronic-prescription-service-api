import {fhir} from "@models"
import {stringifyQuantityValue, stringifyQuantityUnit} from "./utils"

export default function stringifyMaxDosePerPeriod(dosage: fhir.Dosage): Array<string> {
  if (!dosage.maxDosePerPeriod) {
    return []
  }

  const numerator = dosage.maxDosePerPeriod.numerator
  const denominator = dosage.maxDosePerPeriod.denominator
  return [
    "up to a maximum of ",
    stringifyQuantityValue(numerator),
    " ",
    stringifyQuantityUnit(numerator),
    " in ",
    stringifyQuantityValue(denominator),
    " ",
    stringifyQuantityUnit(denominator, true)
  ]
}
