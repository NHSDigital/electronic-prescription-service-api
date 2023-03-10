import {fhir} from "@models"

export default function stringifyRoute(dosage: fhir.Dosage): Array<string> {
  if (!dosage.route) {
    return []
  }
  return dosage.route.coding?.map(coding => coding?.display)
}
