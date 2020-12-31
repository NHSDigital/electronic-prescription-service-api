import * as fhir from "../../../models/fhir/fhir-resources"
import {
  CancellationResponse,
  PertinentInformation1,
  PertinentInformation2
} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {generateResourceId, getFullUrl} from "./common"
import {createIdentifier, createReference} from "./fhir-base-types"

export function createMedicationRequest(
  cancellationResponse: CancellationResponse,
  cancelRequesterPractitionerRoleId: string,
  patientId: string,
  originalPrescriptionAuthorPractitionerRoleId: string
): fhir.MedicationRequestOutcome {
  const pertinentInformation3 = cancellationResponse.pertinentInformation3
  const cancellationCode = pertinentInformation3.pertinentResponse.value._attributes.code
  const cancellationDisplay = pertinentInformation3.pertinentResponse.value._attributes.displayName
  const {
    prescriptionStatusCode,
    prescriptionStatusDisplay,
    medicationRequestStatus
  } = getPrescriptionStatusInformation(cancellationCode, cancellationDisplay)

  return {
    resourceType: "MedicationRequest",
    id: generateResourceId(),
    extension: createMedicationRequestExtensions(
      prescriptionStatusCode,
      prescriptionStatusDisplay,
      cancelRequesterPractitionerRoleId,
    ),
    identifier: createItemNumberIdentifier(cancellationResponse.pertinentInformation1),
    status: medicationRequestStatus,
    intent: "order",
    medicationCodeableConcept: getMedicationCodeableConcept(),
    subject: createReference(patientId),
    //TODO - effectiveTime should probably be the timestamp of the status, not authoredOn
    authoredOn: convertHL7V3DateTimeToIsoDateTimeString(cancellationResponse.effectiveTime),
    requester: createReference(originalPrescriptionAuthorPractitionerRoleId),
    groupIdentifier: getMedicationGroupIdentifier(cancellationResponse.pertinentInformation2),
    dispenseRequest: medicationRequestHasDispenser() ? getDispenseRequest(cancellationResponse) : undefined
  }
}

function createPrescriptionStatusHistoryExtension(
  fhirCode: string, fhirDisplay: string
): fhir.PrescriptionStatusHistoryExtension {
  return {
    "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-PrescriptionStatusHistory",
    "extension": [
      {
        "url": "status",
        "valueCoding": {
          "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history",
          "code": fhirCode,
          "display": fhirDisplay
        }
      }
    ]
  }
}

function createResponsiblePractitionerExtension(
  practitionerRoleId: string
): fhir.ReferenceExtension<fhir.PractitionerRole> {
  return {
    "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "valueReference": {
      "reference": getFullUrl(practitionerRoleId)
    }
  }
}

function createMedicationRequestExtensions(fhirCode: string, fhirDisplay: string, practitionerRoleId: string) {
  return [
    createPrescriptionStatusHistoryExtension(fhirCode, fhirDisplay),
    createResponsiblePractitionerExtension(practitionerRoleId)
  ]
}

function getPrescriptionStatusInformation(code: string, display: string) {
  const extraInformation = display.split("-")[1]
  switch (code) {
  case "0001":
    return {
      prescriptionStatusCode: "R-0001",
      prescriptionStatusDisplay: "Prescription/item was cancelled",
      medicationRequestStatus: "cancelled"
    }
  case "0002":
    return {
      prescriptionStatusCode: "R-0002",
      prescriptionStatusDisplay: "Prescription/item was not cancelled – With dispenser",
      medicationRequestStatus: "active"
    }
  case "0003":
    return {
      prescriptionStatusCode: "R-0003",
      prescriptionStatusDisplay: "Prescription item was not cancelled – With dispenser active",
      medicationRequestStatus: "active"
    }
  case "0004":
    return {
      prescriptionStatusCode: "R-0004",
      prescriptionStatusDisplay: "Prescription/item was not cancelled – Dispensed to Patient",
      medicationRequestStatus: "completed"
    }
  case "0005":
    return {
      prescriptionStatusCode: "R-0005",
      prescriptionStatusDisplay: "Prescription item had expired",
      medicationRequestStatus: "stopped"
    }
  case "0006":
    return {
      prescriptionStatusCode: "R-0006",
      prescriptionStatusDisplay: "Prescription/item had already been cancelled",
      medicationRequestStatus: "cancelled"
    }
  case "0007":
    return {
      prescriptionStatusCode: "R-0007",
      prescriptionStatusDisplay: "Prescription/item cancellation requested by another prescriber",
      medicationRequestStatus: "unknown"
    }
  case "0008":
    return {
      prescriptionStatusCode: "R-0008",
      prescriptionStatusDisplay: "Prescription/item not found",
      medicationRequestStatus: "unknown"
    }
  case "0009":
    return {
      prescriptionStatusCode: "R-0009",
      prescriptionStatusDisplay: "Cancellation functionality disabled in Spine",
      medicationRequestStatus: "active"
    }
  case "0010":
    return {
      prescriptionStatusCode: "R-0010",
      prescriptionStatusDisplay: "Prescription/item was not cancelled. Prescription has been not dispensed",
      medicationRequestStatus: "stopped"
    }
  case "5000":
    return {
      prescriptionStatusCode: "R-5000",
      prescriptionStatusDisplay: `Unable to process message.${extraInformation}`,
      medicationRequestStatus: "unknown"
    }
  case "5888":
    return {
      prescriptionStatusCode: "R-5888",
      prescriptionStatusDisplay: "Invalid message",
      medicationRequestStatus: "unknown"
    }
  default:
    throw InvalidValueError
  }
}

function createItemNumberIdentifier(pertinentInformation1: PertinentInformation1) {
  const id = pertinentInformation1.pertinentLineItemRef.id._attributes.root
  return [createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", id.toLowerCase())]
}

function getMedicationCodeableConcept() {
  return {
    "coding": [{
      "system": "http://snomed.info/sct",
      "code": "763158003",
      "display": "Medicinal product"
    }]
  }
}

function getMedicationGroupIdentifier(pertinentInformation2: PertinentInformation2) {
  const id = pertinentInformation2.pertinentPrescriptionID.value._attributes.extension
  return createIdentifier("https://fhir.nhs.uk/Id/prescription-order-number", id)
}

function medicationRequestHasDispenser() {
  return false
}

function getDispenseRequest(cancellationResponse: CancellationResponse) {
  cancellationResponse
  return {
    performer: {
      extension: [{
        url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DispensingPerformer",
        valueReference: {
          reference: "" //TODO: when we have dispense info we need to fill
        }
      }],
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "" //TODO: when we have dispense info we need to fill
      }
    }
  }
}
