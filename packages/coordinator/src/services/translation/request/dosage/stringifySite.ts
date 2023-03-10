import {fhir} from "@models"

export default function stringifySite(dosage: fhir.Dosage): Array<string> {
  if (!dosage.site) {
    return []
  }
  return dosage.site.coding?.map(coding => coding?.display)
}
