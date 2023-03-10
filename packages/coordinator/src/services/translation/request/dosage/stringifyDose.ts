import {fhir} from "@models"
import {isDoseRange, isDoseSimpleQuantity} from "../../../../utils/type-guards"
import {stringifyQuantityUnit, stringifyQuantityValue, stringifyRange} from "./utils"

export default function stringifyDose(dosage: fhir.Dosage): Array<string> {
  const doseAndRate = dosage.doseAndRate
  const doseQuantity = doseAndRate?.find(isDoseSimpleQuantity)
  const doseRange = doseAndRate?.find(isDoseRange)
  if (doseQuantity) {
    return [stringifyQuantityValue(doseQuantity.doseQuantity), " ", stringifyQuantityUnit(doseQuantity.doseQuantity)]
  } else if (doseRange) {
    return stringifyRange(doseRange.doseRange)
  } else {
    return []
  }
}
