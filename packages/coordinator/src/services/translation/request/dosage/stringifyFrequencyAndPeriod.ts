import {fhir} from "@models"
import {LosslessNumber} from "lossless-json"
import {
  getUnitOfTimeDisplay,
  isOne,
  isTwo,
  stringifyNumericValue,
  stringifyUnitOfTime
} from "./utils"

export default function stringifyFrequencyAndPeriod(dosage: fhir.Dosage): Array<string> {
  const repeat = dosage.timing?.repeat
  const frequency = repeat?.frequency
  const frequencyMax = repeat?.frequencyMax

  const period = repeat?.period
  const periodMax = repeat?.periodMax
  const periodUnit = repeat?.periodUnit

  const isIndefinite = !frequency && !frequencyMax
  if (isIndefinite) {
    return stringifyIndefiniteFrequency(dosage, period, periodMax, periodUnit)
  }

  const isOnce = isOne(frequency) && !frequencyMax
  if (isOnce) {
    return stringifyOnceFrequency(dosage, period, periodMax)
  }

  const isTwice = isTwo(frequency) && !frequencyMax
  if (isTwice) {
    return stringifyTwiceFrequency(dosage, period, periodMax)
  }

  const elements = stringifyStandardFrequency(dosage)
  if (period || periodMax) {
    elements.push(" ", ...stringifyStandardPeriod(dosage))
  }
  return elements
}

function stringifyOnceFrequency(
  dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber
) {
  if (!period && !periodMax) {
    return ["once"]
  } else if (isOne(period) && !periodMax) {
    return ["once ", ...stringifyStandardPeriod(dosage)]
  } else {
    return stringifyStandardPeriod(dosage)
  }
}

function stringifyTwiceFrequency(
  dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber
) {
  if (!period && !periodMax) {
    return ["twice"]
  } else {
    return ["twice ", ...stringifyStandardPeriod(dosage)]
  }
}

function stringifyStandardFrequency(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const frequency = repeat?.frequency
  const frequencyMax = repeat?.frequencyMax
  if (frequency && frequencyMax) {
    return [
      stringifyNumericValue(frequency),
      " to ",
      stringifyNumericValue(frequencyMax),
      " times"
    ]
  } else if (frequency) {
    return [stringifyNumericValue(frequency), " times"]
  } else {
    return ["up to ", stringifyNumericValue(frequencyMax), " times"]
  }
}

function stringifyIndefiniteFrequency(
  _dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber,
  periodUnit: fhir.UnitOfTime
) {
  if (!period && !periodMax) {
    return []
  } else if (isOne(period) && !periodMax) {
    return [getReciprocalUnitOfTimeDisplay(periodUnit)]
  } else {
    //TODO - why is this fine when period is 1 but not otherwise?
    throw new Error(
      "Period or periodMax specified without a frequency and period is not 1."
    )
  }
}

function stringifyStandardPeriod(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const period = repeat?.period
  const periodMax = repeat?.periodMax
  const periodUnit = repeat?.periodUnit
  if (periodMax) {
    return [
      "every ",
      stringifyNumericValue(period),
      " to ",
      stringifyNumericValue(periodMax),
      " ",
      stringifyUnitOfTime(periodUnit, periodMax)
    ]
  } else if (isOne(period)) {
    return [getIndefiniteArticleForUnitOfTime(periodUnit), " ", getUnitOfTimeDisplay(periodUnit)]
  } else {
    return ["every ", stringifyNumericValue(period), " ", stringifyUnitOfTime(periodUnit, period)]
  }
}

function getReciprocalUnitOfTimeDisplay(periodUnit: fhir.UnitOfTime) {
  switch (periodUnit) {
    case fhir.UnitOfTime.SECOND:
      return "every second"
    case fhir.UnitOfTime.MINUTE:
      return "every minute"
    case fhir.UnitOfTime.HOUR:
      return "hourly"
    case fhir.UnitOfTime.DAY:
      return "daily"
    case fhir.UnitOfTime.WEEK:
      return "weekly"
    case fhir.UnitOfTime.MONTH:
      return "monthly"
    case fhir.UnitOfTime.YEAR:
      return "annually"
    default:
      throw new Error("Unhandled unit of time " + periodUnit)
  }
}

function getIndefiniteArticleForUnitOfTime(unitOfTime: fhir.UnitOfTime) {
  if (unitOfTime === fhir.UnitOfTime.HOUR) {
    return "an"
  } else {
    return "a"
  }
}
