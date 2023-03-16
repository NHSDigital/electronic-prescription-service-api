import {fhir} from "@models"
import {getNumericValueAsString, isTruthy} from "../common"
import {LosslessNumber} from "lossless-json"
import moment from "moment"
import {toMap} from "../../../utils/collections"
import pino from "pino"
import {DoseToTextMode, getDoseToTextMode} from "../../../utils/feature-flags"
import {
  isDoseRange,
  isDoseSimpleQuantity,
  isRateRange,
  isRateRatio,
  isRateSimpleQuantity
} from "../../../utils/type-guards"

const SINGULAR_TIME_UNITS: Set<string> = new Set(Object.values(fhir.UnitOfTime).map(getUnitOfTimeDisplay))

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

export function stringifyDosages(dosages: Array<fhir.Dosage>): string {
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

export function stringifyDosage(dosage: fhir.Dosage): string {
  const dosageParts = [
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

function getHeadAndTail<T>(array: Array<T>): [T, Array<T>] {
  const arrayShallowCopy = [...array]
  return [arrayShallowCopy.shift(), arrayShallowCopy]
}

function stringifyMethod(dosage: fhir.Dosage) {
  const method = dosage.method
  if (!method) {
    return []
  }
  //TODO - is this correct? - page says no specific formatting required
  //TODO - if display isn't present we might need to get this from the system and code
  // not sure whether we'll need to lookup in a map or use the code directly
  return method.coding?.map(coding => coding?.display)
}

function stringifyDose(dosage: fhir.Dosage) {
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

function stringifyRate(dosage: fhir.Dosage) {
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

function stringifyDuration(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const duration = repeat?.duration
  const durationMax = repeat?.durationMax
  const durationUnit = repeat?.durationUnit
  if (duration || durationMax) {
    const elements = ["over ", stringifyNumericValue(duration), " ", stringifyUnitOfTime(durationUnit, duration)]
    if (durationMax) {
      elements.push(
        " (maximum ",
        stringifyNumericValue(durationMax),
        " ",
        stringifyUnitOfTime(durationUnit, durationMax),
        ")"
      )
    }
    return elements
  } else {
    return []
  }
}

function stringifyFrequencyAndPeriod(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const frequency = repeat?.frequency
  const frequencyMax = repeat?.frequencyMax

  const period = repeat?.period
  const periodMax = repeat?.periodMax
  const periodUnit = repeat?.periodUnit

  const isIndefinite = !frequency && !frequencyMax
  if(isIndefinite){
    return stringifyIndefiniteFrequency(dosage, period, periodMax, periodUnit)
  }

  const isOnce = isOne(frequency) && !frequencyMax
  if(isOnce){
    return stringifyOnceFrequency(dosage, period, periodMax)
  }

  const isTwice = isTwo(frequency) && !frequencyMax
  if(isTwice){
    return stringifyTwiceFrequency(dosage, period, periodMax)
  }

  const elements = stringifyStandardFrequency(dosage)
  if (period || periodMax) {
    elements.push(" ", ...stringifyStandardPeriod(dosage))
  }
  return elements
}

function stringifyIndefiniteFrequency(
  _dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber,
  periodUnit: fhir.UnitOfTime
){
  if (!period && !periodMax) {
    return []
  } else if (isOne(period) && !periodMax) {
    return [getReciprocalUnitOfTimeDisplay(periodUnit)]
  } else {
    //TODO - why is this fine when period is 1 but not otherwise?
    throw new Error("Period or periodMax specified without a frequency and period is not 1.")
  }
}

function stringifyOnceFrequency(
  dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber
){
  if (!period && !periodMax) {
    return ["once"]
  } else if (isOne(period) && !periodMax) {
    return ["once ", ...stringifyStandardPeriod(dosage)]
  }else{
    return stringifyStandardPeriod(dosage)
  }
}

function stringifyTwiceFrequency(
  dosage: fhir.Dosage,
  period: string | LosslessNumber,
  periodMax: string | LosslessNumber
){
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
    return [stringifyNumericValue(frequency), " to ", stringifyNumericValue(frequencyMax), " times"]
  } else if (frequency) {
    return [stringifyNumericValue(frequency), " times"]
  } else {
    return ["up to ", stringifyNumericValue(frequencyMax), " times"]
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

function stringifyOffsetAndWhen(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const offset = repeat?.offset
  const when = repeat?.when
  if (!offset && !when) {
    return []
  }

  const elements = []

  if (offset) {
    const offsetMinutesStr = getNumericValueAsString(offset)
    const offsetMinutesInt = parseInt(offsetMinutesStr)
    const [offsetValue, offsetUnit] = getOffsetValueAndUnit(offsetMinutesInt)
    elements.push(offsetValue, " ", pluraliseUnit(offsetUnit, offsetValue), " ")
  }

  const formattedEventTimings = when.map(getEventTimingDisplay)
  elements.push(...getListWithSeparators(formattedEventTimings))

  return elements
}

function getOffsetValueAndUnit(offsetMinutes: number) {
  if (offsetMinutes % 60 !== 0) {
    return [offsetMinutes.toString(), "minute"]
  }

  const offsetHours = offsetMinutes / 60
  if (offsetHours % 24 !== 0) {
    return [offsetHours.toString(), "hour"]
  }

  const offsetDays = offsetHours / 24
  return [offsetDays.toString(), "day"]
}

function stringifyDayOfWeekAndTimeOfDay(dosage: fhir.Dosage) {
  const repeat = dosage?.timing?.repeat
  const dayOfWeek = repeat?.dayOfWeek
  const timeOfDay = repeat?.timeOfDay
  if (!dayOfWeek?.length && !timeOfDay?.length) {
    return []
  }

  const elements = []

  if (dayOfWeek?.length) {
    const formattedDaysOfWeek = dayOfWeek.map(getDayOfWeekDisplay)
    elements.push("on ", ...getListWithSeparators(formattedDaysOfWeek))
  }

  if (timeOfDay?.length) {
    if (elements.length) {
      elements.push(" ")
    }
    const formattedTimesOfDay = timeOfDay.map(formatTime)
    elements.push("at ", ...getListWithSeparators(formattedTimesOfDay))
  }

  return elements
}

function stringifyRoute(dosage: fhir.Dosage) {
  if (!dosage.route) {
    return []
  }
  return dosage.route.coding?.map(coding => coding?.display)
}

function stringifySite(dosage: fhir.Dosage) {
  if (!dosage.site) {
    return []
  }
  return dosage.site.coding?.map(coding => coding?.display)
}

function stringifyAsNeeded(dosage: fhir.Dosage) {
  if (dosage.asNeededCodeableConcept) {
    if (!dosage.asNeededCodeableConcept.coding?.length) {
      throw new Error("No entries in asNeededCodeableConcept.")
    }
    const asNeededDisplays = dosage.asNeededCodeableConcept.coding?.map(coding => coding?.display)
    return ["as required for ", ...getListWithSeparators(asNeededDisplays)]
  } else if (dosage.asNeededBoolean) {
    return ["as required"]
  } else {
    return []
  }
}

function stringifyBounds(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const boundsDuration = repeat?.boundsDuration
  const boundsRange = repeat?.boundsRange
  const boundsPeriod = repeat?.boundsPeriod
  if (boundsDuration) {
    return ["for ", stringifyQuantityValue(boundsDuration), " ", stringifyQuantityUnit(boundsDuration, true)]
  } else if (boundsRange) {
    return ["for ", ...stringifyRange(boundsRange, true)]
  } else if (boundsPeriod) {
    //TODO - boundsPeriod is not in the guide, but is allowed by FHIR - check we're representing it correctly
    if (boundsPeriod.start && boundsPeriod.end) {
      return ["from ", formatDate(boundsPeriod.start), " to ", formatDate(boundsPeriod.end)]
    } else if (boundsPeriod.start) {
      return ["from ", formatDate(boundsPeriod.start)]
    } else {
      return ["until ", formatDate(boundsPeriod.end)]
    }
  } else {
    return []
  }
}

/**
 * TODO - implemented as per the guide but this doesn't combine very well with other elements
 */
function stringifyCount(dosage: fhir.Dosage) {
  const repeat = dosage.timing?.repeat
  const count = repeat?.count
  const countMax = repeat?.countMax
  if (!count && !countMax) {
    return []
  }

  if (isOne(count) && !countMax) {
    return ["take once"]
  }

  if (isTwo(count) && !countMax) {
    return ["take twice"]
  }

  const elements = ["take ", stringifyNumericValue(count)]
  if (countMax) {
    elements.push(" to ", stringifyNumericValue(countMax))
  }
  elements.push(" times")
  return elements
}

function stringifyEvent(dosage: fhir.Dosage) {
  const event = dosage.timing?.event
  if (!event?.length) {
    return []
  }

  const formattedEvents = event.map(formatDate)
  return ["on ", ...getListWithSeparators(formattedEvents)]
}

function stringifyMaxDosePerPeriod(dosage: fhir.Dosage) {
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

function stringifyMaxDosePerAdministration(dosage: fhir.Dosage) {
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

function stringifyMaxDosePerLifetime(dosage: fhir.Dosage) {
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

/**
 * TODO - Implemented as per the guide but chaining multiple instructions in this way could change their meaning
 */
function stringifyAdditionalInstruction(dosage: fhir.Dosage) {
  if (!dosage.additionalInstruction?.length) {
    return []
  }

  const additionalInstructionDisplays = dosage.additionalInstruction
    .flatMap(codeableConcept => codeableConcept?.coding)
    .map(coding => coding?.display)
  return getListWithSeparators(additionalInstructionDisplays)
}

function stringifyPatientInstruction(dosage: fhir.Dosage) {
  if (!dosage.patientInstruction) {
    return []
  }
  return [dosage.patientInstruction]
}

function formatTime(time: string) {
  const timeMoment = moment.utc(time, ["HH:mm:ss.SSSSSSSSS", "HH:mm:ss"], true)
  if (!timeMoment.isValid()) {
    throw new Error("Invalid time of day " + time)
  }

  if (timeMoment.get("seconds") === 0) {
    return timeMoment.format("HH:mm")
  }

  return timeMoment.format("HH:mm:ss")
}

function formatDate(dateTime: string) {
  const dateTimeMoment = moment.utc(dateTime, moment.ISO_8601, true)
  if (!dateTimeMoment.isValid()) {
    throw new Error("Invalid dateTime " + dateTime)
  }
  return dateTimeMoment.format("DD/MM/YYYY")
}

function getIndefiniteArticleForUnitOfTime(unitOfTime: fhir.UnitOfTime) {
  if (unitOfTime === fhir.UnitOfTime.HOUR) {
    return "an"
  } else {
    return "a"
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

function stringifyUnitOfTime(unitOfTime: fhir.UnitOfTime, value: string | LosslessNumber) {
  const unit = getUnitOfTimeDisplay(unitOfTime)
  return pluraliseUnit(unit, value)
}

function stringifyQuantityUnit(quantity: fhir.Quantity, pluralise = false) {
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

function pluraliseUnit(unit: string, value: string | LosslessNumber) {
  if (unit) {
    if (!value || isOne(value) || !unitCanBeSafelyPluralised(unit)) {
      return unit
    } else {
      return `${unit}s`
    }
  }
  return null
}

function unitCanBeSafelyPluralised(unit: string) {
  return SINGULAR_TIME_UNITS.has(unit)
}

function isOne(numericValue: string | LosslessNumber) {
  //TODO - compare number instead of string? what about 1.00?
  return stringifyNumericValue(numericValue) === "1"
}

function isTwo(numericValue: string | LosslessNumber) {
  //TODO - compare number instead of string? what about 2.00?
  return stringifyNumericValue(numericValue) === "2"
}

function getListWithSeparators(list: Array<string>) {
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

function stringifyRange(range: fhir.Range, pluralise = false): Array<string> {
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

function getUnitOfTimeDisplay(unitOfTime: fhir.UnitOfTime) {
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

function getEventTimingDisplay(eventTiming: fhir.EventTiming) {
  switch (eventTiming) {
    case fhir.EventTiming.MORNING:
      return "during the morning"
    case fhir.EventTiming.EARLY_MORNING:
      return "during the early morning"
    case fhir.EventTiming.LATE_MORNING:
      return "during the late morning"
    case fhir.EventTiming.NOON:
      return "around 12:00pm"
    case fhir.EventTiming.AFTERNOON:
      return "during the afternoon"
    case fhir.EventTiming.EARLY_AFTERNOON:
      return "during the early afternoon"
    case fhir.EventTiming.LATE_AFTERNOON:
      return "during the late afternoon"
    case fhir.EventTiming.EVENING:
      return "during the evening"
    case fhir.EventTiming.EARLY_EVENING:
      return "during the early evening"
    case fhir.EventTiming.LATE_EVENING:
      return "during the late evening"
    case fhir.EventTiming.NIGHT:
      return "during the night"
    case fhir.EventTiming.AFTER_SLEEP:
      return "once asleep"
    case fhir.EventTiming.BEFORE_SLEEP:
      return "before sleep"
    case fhir.EventTiming.UPON_WAKING:
      return "upon waking"
    case fhir.EventTiming.AT_MEAL:
      return "at a meal"
    case fhir.EventTiming.AT_BREAKFAST:
      return "at breakfast"
    case fhir.EventTiming.AT_LUNCH:
      return "at lunch"
    case fhir.EventTiming.AT_DINNER:
      return "at dinner"
    case fhir.EventTiming.BEFORE_MEAL:
      return "before a meal"
    case fhir.EventTiming.BEFORE_BREAKFAST:
      return "before breakfast"
    case fhir.EventTiming.BEFORE_LUNCH:
      return "before lunch"
    case fhir.EventTiming.BEFORE_DINNER:
      return "before dinner"
    case fhir.EventTiming.AFTER_MEAL:
      return "after a meal"
    case fhir.EventTiming.AFTER_BREAKFAST:
      return "after breakfast"
    case fhir.EventTiming.AFTER_LUNCH:
      return "after lunch"
    case fhir.EventTiming.AFTER_DINNER:
      return "after dinner"
    default:
      throw new Error("Unhandled EventTiming " + eventTiming)
  }
}

function getDayOfWeekDisplay(dayOfWeek: fhir.DayOfWeek) {
  switch (dayOfWeek) {
    case fhir.DayOfWeek.MONDAY:
      return "Monday"
    case fhir.DayOfWeek.TUESDAY:
      return "Tuesday"
    case fhir.DayOfWeek.WEDNESDAY:
      return "Wednesday"
    case fhir.DayOfWeek.THURSDAY:
      return "Thursday"
    case fhir.DayOfWeek.FRIDAY:
      return "Friday"
    case fhir.DayOfWeek.SATURDAY:
      return "Saturday"
    case fhir.DayOfWeek.SUNDAY:
      return "Sunday"
    default:
      throw new Error("Unhandled DayOfWeek " + dayOfWeek)
  }
}
