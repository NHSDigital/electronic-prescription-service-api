import * as fhir from "../../../../models/fhir/fhir-resources"
import {LineItem} from "../../../../models/hl7-v3/hl7-v3-prescriptions"

export function createMedicationRequest(
  lineItem: LineItem,
  patientId: string,
  requesterId: string,
  responsiblePartyId: string
): fhir.MedicationRequest {
  lineItem
  patientId
  requesterId
  responsiblePartyId
  return null
}
