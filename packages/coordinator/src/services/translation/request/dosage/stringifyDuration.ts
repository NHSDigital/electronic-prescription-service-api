import {fhir} from "@models"
import {stringifyNumericValue, stringifyUnitOfTime} from "./utils"

export default function stringifyDuration(dosage: fhir.Dosage): Array<string> {
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
