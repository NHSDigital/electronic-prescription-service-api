import {fhir} from "@models"
import moment from "moment"
import {getListWithSeparators} from "./utils"

export default function stringifyDayOfWeekAndTimeOfDay(dosage: fhir.Dosage): Array<string> {
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
