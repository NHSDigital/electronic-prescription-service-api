import {fhir} from "@models"

export default function stringifyMethod(dosage: fhir.Dosage): Array<string> {
  const method = dosage.method
  if (!method) {
    return []
  }
  //TODO - is this correct? - page says no specific formatting required
  //TODO - if display isn't present we might need to get this from the system and code
  // not sure whether we'll need to lookup in a map or use the code directly
  return method.coding?.map(coding => coding?.display)
}
