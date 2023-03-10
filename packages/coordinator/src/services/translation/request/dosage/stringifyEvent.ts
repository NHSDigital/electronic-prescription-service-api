import {fhir} from "@models"
import {formatDate, getListWithSeparators} from "./utils"

export default function stringifyEvent(dosage: fhir.Dosage): Array<string> {
  const event = dosage.timing?.event
  if (!event?.length) {
    return []
  }

  const formattedEvents = event.map(formatDate)
  return ["on ", ...getListWithSeparators(formattedEvents)]
}
