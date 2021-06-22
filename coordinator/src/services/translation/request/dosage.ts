import {fhir} from "@models"
import {getNumericValueAsString, isTruthy} from "../common"
import {LosslessNumber} from "lossless-json"

export function stringifyDosage(dosageInstruction: fhir.Dosage): string {
  const dosageParts = [
    stringifyMethod(dosageInstruction),
    stringifyDose(dosageInstruction),
    stringifyRate(dosageInstruction),
    stringifyDuration(dosageInstruction)
  ]
  if (dosageParts.some(part => part?.some(element => !element))) {
    console.error(dosageParts)
    throw new Error("Null or undefined dosage element - required field not populated.")
  }
  return dosageParts.map(part => part?.join("")).filter(isTruthy).join(" ")
}

function stringifyMethod(dosageInstruction: fhir.Dosage) {
  const method = dosageInstruction.method
  if (!method) {
    return []
  }
  //TODO - is this correct? - page says no specific formatting required
  //TODO - if display isn't present we might need to get this from the system and code
  // not sure whether we'll need to lookup in a map or use the code directly
  return method.coding?.map(coding => coding?.display)
}

function stringifyDose(dosageInstruction: fhir.Dosage) {
  const doseAndRate = dosageInstruction.doseAndRate
  const doseQuantity = doseAndRate?.doseQuantity
  const doseRange = doseAndRate?.doseRange
  if (doseQuantity) {
    return [
      stringifyQuantityValue(doseQuantity), " ", stringifyQuantityUnit(doseQuantity)
    ]
  } else if (doseRange) {
    //TODO - enforce the same low and high unit?
    return [
      stringifyQuantityValue(doseRange.low),
      " to ",
      stringifyQuantityValue(doseRange.high),
      " ",
      stringifyQuantityUnit(doseRange.high)
    ]
  } else {
    return []
  }
}

function stringifyRate(dosageInstruction: fhir.Dosage) {
  const doseAndRate = dosageInstruction.doseAndRate
  const rateRatio = doseAndRate?.rateRatio
  const rateRange = doseAndRate?.rateRange
  const rateQuantity = doseAndRate?.rateQuantity
  if (rateRatio) {
    const numerator = rateRatio.numerator
    const denominator = rateRatio.denominator
    //TODO - compare number instead of string? what about 1.00?
    if (stringifyQuantityValue(denominator) === "1") {
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
        stringifyPluralQuantityUnit(denominator)
      ]
    }
  } else if (rateRange) {
    //TODO - enforce that low and high units are the same?
    const low = rateRange.low
    const high = rateRange.high
    return [
      "at a rate of ",
      stringifyQuantityValue(low),
      " to ",
      stringifyQuantityValue(high),
      " ",
      stringifyQuantityUnit(high)
    ]
  } else if (rateQuantity) {
    return [
      "at a rate of ", stringifyQuantityValue(rateQuantity), " ", stringifyQuantityUnit(rateQuantity)
    ]
  } else {
    return []
  }
}

function stringifyDuration(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const duration = repeat?.duration
  const durationMax = repeat?.durationMax
  const durationUnit = repeat?.durationUnit
  if (duration) {
    const elements = [
      "over ", stringifyNumericValue(duration), " ", pluraliseUnit(durationUnit, duration)
    ]
    if (durationMax) {
      elements.push(
        " (maximum ", stringifyNumericValue(durationMax), " ", pluraliseUnit(durationUnit, durationMax), ")"
      )
    }
    elements.push(".")
    return elements
  } else {
    return []
  }
}

function stringifyQuantityValue(quantity: fhir.Quantity) {
  const value = quantity?.value
  return stringifyNumericValue(value)
}

function stringifyNumericValue(value: string | LosslessNumber) {
  if (value) {
    return getNumericValueAsString(value)
  }
  return null
}

function stringifyPluralQuantityUnit(quantity: fhir.Quantity) {
  const unit = stringifyQuantityUnit(quantity)
  return pluraliseUnit(unit, quantity?.value)
}

function stringifyQuantityUnit(quantity: fhir.Quantity) {
  const unit = quantity?.unit
  if (unit) {
    return unit
  }
  //TODO - if unit isn't present we might need to get this from the system and code
  // not sure whether we'll need to lookup in a map or use the code directly
  return null
}

/**
 * Naive implementation for now, can handle special cases later if needed
 */
function pluraliseUnit(unit: string, value: string | LosslessNumber) {
  if (unit) {
    //TODO - compare number instead of string? what about 1.00?
    if (stringifyNumericValue(value) === "1") {
      return unit
    } else {
      return `${unit}s`
    }
  }
  return null
}
