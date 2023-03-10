import {fhir} from "@models"
import {stringifyQuantityValue, stringifyQuantityUnit} from "./utils"

export default function stringifyMaxDosePerLifetime(dosage: fhir.Dosage): Array<string> {
  if (!dosage.maxDosePerLifetime) {
    return []
  }

  return [
    "up to a maximum of ",
    stringifyQuantityValue(dosage.maxDosePerLifetime),
    " ",
    stringifyQuantityUnit(dosage.maxDosePerLifetime),
    " for the lifetime of the patient"
  ]
}
