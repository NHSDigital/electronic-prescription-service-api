import {DetailTrackerResponse} from "./spine-model"
import {fhir} from "@models"
import * as uuid from "uuid"

function isPrescriptionField(trackerResponse: DetailTrackerResponse, fieldName: string) {
  return !!trackerResponse[fieldName].prescriptionStatus
}

function getStatusCodeFromDisplay(display: string): string {
  switch (display) {
    case "To be Dispensed":
      return "0001"
    case "With Dispenser":
      return "0002"
    case "With Dispenser - Active":
      return "0003"
    case "Expired":
      return "0004"
    case "Cancelled":
      return "0005"
    case "Dispensed":
      return "0006"
    case "Not Dispensed":
      return "0007"
    default:
      throw new Error
  }
}

export function convertDetailedJsonResponseToFhirTask(response: DetailTrackerResponse): fhir.Task {
  const prescriptionIds = Object.keys(response).filter(fieldName => isPrescriptionField(response, fieldName))
  const prescriptions = prescriptionIds.map(id => response[id])
  const prescription = prescriptions[0]

  const owner = prescription.dispensingPharmacy ?? prescription.nominatedPharmacy

  return {
    resourceType: "Task",
    identifier: [fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())],
    status: undefined,
    businessStatus: fhir.createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      getStatusCodeFromDisplay(prescription.prescriptionStatus),
      prescription.prescriptionStatus
    ),
    intent: fhir.TaskIntent.ORDER,
    focus: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-number", prescriptionIds[0])
    ),
    for: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/nhs-number", prescription.patientNhsNumber)
    ),
    authoredOn: prescription.prescriptionIssueDate,
    owner: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", owner.ods),
      owner.name
    ),
    input: [{
      extension: [
        undefined
      ],
      type: undefined,
      valueReference: fhir.createIdentifierReference(
        fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())
      )
    }],
    output: undefined
  }
}
