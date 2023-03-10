import {fhir} from "@models"
import {stringifyQuantityUnit, stringifyQuantityValue} from "./utils"

export default function stringifyMaxDosePerAdministration(dosage: fhir.Dosage): Array<string> {
  if (!dosage.maxDosePerAdministration) {
    return []
  }

  return [
    "up to a maximum of ",
    stringifyQuantityValue(dosage.maxDosePerAdministration),
    " ",
    stringifyQuantityUnit(dosage.maxDosePerAdministration),
    " per dose"
  ]
}
