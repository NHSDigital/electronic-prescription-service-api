import * as fhir from "../../../models/fhir/fhir-resources"
import {getFullUrl} from "./common"
import {createIdentifier} from "./fhir-base-types"
import {MedicationRequestGroupIdentifier} from "../../../models/fhir/medication-request"

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
  return createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", lineItemId.toLowerCase())
}

export function createGroupIdentifier(shortFormId: string, longFormId?: string): MedicationRequestGroupIdentifier {
  const groupIdentifier: MedicationRequestGroupIdentifier = createIdentifier(
    "https://fhir.nhs.uk/Id/prescription-order-number",
    shortFormId
  )

  if (longFormId) {
    groupIdentifier.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
      valueIdentifier: createIdentifier(
        "https://fhir.nhs.uk/Id/prescription",
        longFormId
      )
    }]
  }

  return groupIdentifier
}
