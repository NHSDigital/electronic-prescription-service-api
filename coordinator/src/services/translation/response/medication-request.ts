import {getFullUrl} from "./common"
import {fhir} from "../../../../../models/library"

export function createResponsiblePractitionerExtension(
  practitionerRoleId: string
): fhir.ReferenceExtension<fhir.PractitionerRole> {
  return {
    "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "valueReference": {
      "reference": getFullUrl(practitionerRoleId)
    }
  }
}

export function createItemNumberIdentifier(lineItemId: string): fhir.Identifier {
  return fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", lineItemId.toLowerCase())
}

export function createGroupIdentifier(shortFormId: string, longFormId?: string): fhir.MedicationRequestGroupIdentifier {
  const groupIdentifier: fhir.MedicationRequestGroupIdentifier = fhir.createIdentifier(
    "https://fhir.nhs.uk/Id/prescription-order-number",
    shortFormId
  )

  if (longFormId) {
    groupIdentifier.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
      valueIdentifier: fhir.createIdentifier(
        "https://fhir.nhs.uk/Id/prescription",
        longFormId
      )
    }]
  }

  return groupIdentifier
}
