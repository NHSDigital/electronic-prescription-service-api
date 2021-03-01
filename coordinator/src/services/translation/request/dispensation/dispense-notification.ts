import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"

export function convertDispenseNotification(
  bundle: fhir.Bundle): hl7V3.DispenseNotification {
  console.log(JSON.stringify(bundle))
  return new hl7V3.DispenseNotification()
}
