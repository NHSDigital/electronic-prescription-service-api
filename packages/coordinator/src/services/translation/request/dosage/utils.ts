import {fhir} from "@models"
import {LosslessNumber} from "lossless-json"
import moment from "moment"
import {getNumericValueAsString} from "../../common"

export function getListWithSeparators(list: Array<string>): Array<string> {
  const elements: Array<string> = []

  list.forEach((listElement, index) => {
    elements.push(listElement)
    if (index < list.length - 2) {
      elements.push(", ")
    } else if (index < list.length - 1) {
      elements.push(" and ")
    }
  })

  return elements
}

export function stringifyNumericValue(value: string | LosslessNumber): string {
  if (value) {
    return getNumericValueAsString(value)
  }
  return null
}

export function isOne(numericValue: string | LosslessNumber): boolean{
  //TODO - compare number instead of string? what about 1.00?
  return stringifyNumericValue(numericValue) === "1"
}

export function isTwo(numericValue: string | LosslessNumber): boolean {
  //TODO - compare number instead of string? what about 2.00?
  return stringifyNumericValue(numericValue) === "2"
}

export function formatDate(dateTime: string): string {
  const dateTimeMoment = moment.utc(dateTime, moment.ISO_8601, true)
  if (!dateTimeMoment.isValid()) {
    throw new Error("Invalid dateTime " + dateTime)
  }
  return dateTimeMoment.format("DD/MM/YYYY")
}

export function stringifyQuantityValue(quantity: fhir.Quantity): string {
  const value = quantity?.value
  return stringifyNumericValue(value)
}

export function stringifyUnitOfTime(
  unitOfTime: fhir.UnitOfTime,
  value: string | LosslessNumber
): string {
  const unit = getUnitOfTimeDisplay(unitOfTime)
  return pluraliseUnit(unit, value)
}

export function stringifyQuantityUnit(
  quantity: fhir.Quantity,
  pluralise = false
): string {
  const unit = quantity?.unit
  if (unit) {
    if (pluralise) {
      return pluraliseUnit(unit, quantity?.value)
    } else {
      return unit
    }
  }
  return null
}

export function pluraliseUnit(unit: string, value: string | LosslessNumber): string {
  if (unit) {
    if (!value || isOne(value) || !unitCanBeSafelyPluralised(unit)) {
      return unit
    } else {
      return `${unit}s`
    }
  }
  return null
}

export function stringifyRange(
  range: fhir.Range,
  pluralise = false
): Array<string> {
  const lowQuantity = range?.low
  const highQuantity = range?.high
  const lowUnit = stringifyQuantityUnit(lowQuantity, pluralise)
  const highUnit = stringifyQuantityUnit(highQuantity, pluralise)
  const lowValue = stringifyQuantityValue(lowQuantity)
  const highValue = stringifyQuantityValue(highQuantity)

  if (lowQuantity && !highQuantity) {
    return ["at least ", lowValue, " ", lowUnit]
  }
  if (highQuantity && !lowQuantity) {
    return ["up to ", highValue, " ", highUnit]
  }
  if (lowUnit !== highUnit) {
    return [lowValue, " ", lowUnit, " to ", highValue, " ", highUnit]
  }
  return [lowValue, " to ", highValue, " ", highUnit]
}

export function getUnitOfTimeDisplay(unitOfTime: fhir.UnitOfTime): string {
  switch (unitOfTime) {
    case fhir.UnitOfTime.SECOND:
      return "second"
    case fhir.UnitOfTime.MINUTE:
      return "minute"
    case fhir.UnitOfTime.HOUR:
      return "hour"
    case fhir.UnitOfTime.DAY:
      return "day"
    case fhir.UnitOfTime.WEEK:
      return "week"
    case fhir.UnitOfTime.MONTH:
      return "month"
    case fhir.UnitOfTime.YEAR:
      return "year"
    default:
      throw new Error("Unhandled unit of time " + unitOfTime)
  }
}

const SINGULAR_TIME_UNITS: Set<string> = new Set(
  Object.values(fhir.UnitOfTime).map(getUnitOfTimeDisplay)
)

function unitCanBeSafelyPluralised(unit: string) {
  return SINGULAR_TIME_UNITS.has(unit)
}
