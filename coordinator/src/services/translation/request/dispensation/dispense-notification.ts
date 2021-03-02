import * as hl7V3 from "../../../../models/hl7-v3"
import * as fhir from "../../../../models/fhir"
import {getIdentifierValueForSystem} from "../../common"

export function convertDispenseNotification(
  bundle: fhir.Bundle): hl7V3.DispenseNotification {

  const messageId = getIdentifierValueForSystem(
    [bundle.identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Bundle.identifier"
  )

  const dispenseNotification = new hl7V3.DispenseNotification(
    new hl7V3.GlobalIdentifier(messageId)
  )

  const fhirPatient = {
    identifier: [{
      system: "https://fhir.nhs.uk/Id/nhs-number",
      value: "9453740519"
    }]
  }

  const hl7V3Patient = new hl7V3.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    fhirPatient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new hl7V3.NhsNumber(nhsNumber)
  dispenseNotification.recordTarget = new hl7V3.RecordTarget(hl7V3Patient)

  return dispenseNotification
}
