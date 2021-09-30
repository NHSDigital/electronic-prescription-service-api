import {MedicationRequest} from "../../models"
import * as fhirExtension from "../../models/extension"

export function getMedicationRequestNumberOfRepeatsAllowed(medicationRequest: MedicationRequest): string | number {
  const repeatInformation = medicationRequest.extension.find(e =>
    e.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
  )
  const numberOfRepeatPrescriptionsAllowedExtension =
    repeatInformation.extension.find(e =>
      e.url === "numberOfRepeatPrescriptionsAllowed") as fhirExtension.UnsignedIntExtension
  return numberOfRepeatPrescriptionsAllowedExtension.valueUnsignedInt.valueOf()
}
