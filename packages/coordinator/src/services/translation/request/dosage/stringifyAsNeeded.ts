import {fhir} from "@models"
import {getListWithSeparators} from "./utils"

export default function stringifyAsNeeded(dosage: fhir.Dosage): Array<string> {
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
