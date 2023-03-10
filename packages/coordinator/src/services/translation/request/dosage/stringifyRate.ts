import {fhir} from "@models"
import {isRateRange, isRateRatio, isRateSimpleQuantity} from "../../../../utils/type-guards"
import {
  isOne,
  stringifyQuantityUnit,
  stringifyQuantityValue,
  stringifyRange
} from "./utils"

export default function stringifyRate(dosage: fhir.Dosage): Array<string> {
  const doseAndRate = dosage.doseAndRate
  const rateRatio = doseAndRate?.find(isRateRatio)
  const rateRange = doseAndRate?.find(isRateRange)
  const rateQuantity = doseAndRate?.find(isRateSimpleQuantity)
  if (rateRatio) {
    const {numerator, denominator} = rateRatio.rateRatio
    if (isOne(denominator?.value)) {
      return [
        "at a rate of ",
        stringifyQuantityValue(numerator),
        " ",
        stringifyQuantityUnit(numerator),
        " per ",
        stringifyQuantityUnit(denominator)
      ]
    } else {
      return [
        "at a rate of ",
        stringifyQuantityValue(numerator),
        " ",
        stringifyQuantityUnit(numerator),
        " every ",
        stringifyQuantityValue(denominator),
        " ",
        stringifyQuantityUnit(denominator, true)
      ]
    }
  } else if (rateRange) {
    return ["at a rate of ", ...stringifyRange(rateRange.rateRange)]
  } else if (rateQuantity) {
    return [
      "at a rate of ",
      stringifyQuantityValue(rateQuantity.rateQuantity),
      " ",
      stringifyQuantityUnit(rateQuantity.rateQuantity)
    ]
  } else {
    return []
  }
}
