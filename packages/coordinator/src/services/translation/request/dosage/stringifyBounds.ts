import {fhir} from "@models"
import {
  formatDate,
  stringifyQuantityUnit,
  stringifyQuantityValue,
  stringifyRange
} from "./utils"

export default function stringifyBounds(dosage: fhir.Dosage): Array<string> {
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
