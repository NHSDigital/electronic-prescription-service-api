import {fhir} from "@models"
import {getNumericValueAsString} from "../../common"
import {getListWithSeparators, pluraliseUnit} from "./utils"

export default function stringifyOffsetAndWhen(dosage: fhir.Dosage): Array<string> {
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
    elements.push(
      offsetValue,
      " ",
      pluraliseUnit(offsetUnit, offsetValue),
      " "
    )
  }

  const formattedEventTimings = when.map(getEventTimingDisplay)
  elements.push(...getListWithSeparators(formattedEventTimings))

  return elements
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
