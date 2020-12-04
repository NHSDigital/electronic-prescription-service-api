import * as fhir from "../../../models/fhir/fhir-resources"
import {
  CancellationResponse,
  PertinentInformation1,
  PertinentInformation2
} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {convertHL7V3DateTimeStringToISODateTime} from "./common"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export function createMedicationRequest(
  cancellationResponse: CancellationResponse,
  responsiblePartyPractitionerRoleId: string,
  patientId: string,
  authorPractitionerRoleId: string
): fhir.MedicationRequest {
  const medicationRequest = {resourceType: "MedicationRequest"} as fhir.MedicationRequest

  const pertinentInformation3 = cancellationResponse.pertinentInformation3
  const cancellationCode = pertinentInformation3.pertinentResponse.value._attributes.code
  const cancellationDisplay = pertinentInformation3.pertinentResponse.value._attributes.displayName
  const {fhirCode, fhirDisplay, fhirStatus} = getCodeDisplayAndStatus(cancellationCode, cancellationDisplay)

  medicationRequest.extension = createExtensions(responsiblePartyPractitionerRoleId, fhirCode, fhirDisplay)

  const pertinentInformation1 = cancellationResponse.pertinentInformation1
  medicationRequest.identifier = createIdentifier(pertinentInformation1)

  medicationRequest.status = fhirStatus

  medicationRequest.intent = "order"

  medicationRequest.medicationCodeableConcept = getMedicationCodeableConcept()

  medicationRequest.subject = createSubject(patientId)

  medicationRequest.authoredOn = convertHL7V3DateTimeStringToISODateTime(
    cancellationResponse.effectiveTime._attributes.value
  )

  medicationRequest.requester = {
    reference: authorPractitionerRoleId
  }

  const pertinentInformation2 = cancellationResponse.pertinentInformation2
  medicationRequest.groupIdentifier = getMedicationGroupIdentifier(pertinentInformation2)

  if (medicationRequestHasDispenser()) {
    medicationRequest.dispenseRequest = getDispenseRequest(cancellationResponse)
  }

  return medicationRequest
}

function createExtensions(practitionerRoleId: string, fhirCode: string, fhirDisplay: string) {
  return [
    {
      "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-PrescriptionStatusHistory",
      "extension":  [
        {
          "url": "status",
          "valueCoding": {
            "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history",
            "code": fhirCode,
            "display": fhirDisplay
          }
        }
      ]
    },
    {
      "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      "valueReference": {
        "reference": practitionerRoleId
      }
    }
  ]
}

function getCodeDisplayAndStatus(code: string, display: string) {
  const extraInformation = display.split("-")[1]
  switch (code) {
  case "0001":
    return {
      fhirCode: "R-0001",
      fhirDisplay: "Prescription/item was cancelled",
      fhirStatus: "cancelled"
    }
  case "0002":
    return {
      fhirCode: "R-0002",
      fhirDisplay: "Prescription/item was not cancelled – With dispenser",
      fhirStatus: "active"
    }
  case "0003":
    return {
      fhirCode: "R-0003",
      fhirDisplay: "Prescription item was not cancelled – With dispenser active",
      fhirStatus: "active"
    }
  case "0004":
    return {
      fhirCode: "R-0004",
      fhirDisplay: "Prescription/item was not cancelled – Dispensed to Patient",
      fhirStatus: "completed"
    }
  case "0005":
    return {
      fhirCode: "R-0005",
      fhirDisplay: "Prescription item had expired",
      fhirStatus: "stopped"
    }
  case "0006":
    return {
      fhirCode: "R-0006",
      fhirDisplay: "Prescription/item had already been cancelled",
      fhirStatus: "cancelled"
    }
  case "0007":
    return {
      fhirCode: "R-0007",
      fhirDisplay: "Prescription/item cancellation requested by another prescriber",
      fhirStatus: "unknown"
    }
  case "0008":
    return {
      fhirCode: "R-0008",
      fhirDisplay: "Prescription/item not found",
      fhirStatus: "unknown"
    }
  case "0009":
    return {
      fhirCode: "R-0009",
      fhirDisplay: "Cancellation functionality disabled in Spine",
      fhirStatus: "active"
    }
  case "0010":
    return {
      fhirCode: "R-0010",
      fhirDisplay: "Prescription/item was not cancelled. Prescription has been not dispensed",
      fhirStatus: "stopped"
    }
  case "5000":
    return {
      fhirCode: "R-5000",
      fhirDisplay: `Unable to process message.${extraInformation}`,
      fhirStatus: "unknown"
    }
  case "5888":
    return {
      fhirCode: "R-5888",
      fhirDisplay: "Invalid message",
      fhirStatus: "unknown"
    }
  default:
    throw InvalidValueError
  }
}

function createIdentifier(pertinentInformation1: PertinentInformation1) {
  const id = pertinentInformation1.pertinentLineItemRef.id._attributes.root
  return [{
    system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
    value: id.toLocaleLowerCase()
  }]
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

function createSubject(patientId: string) {
  return {
    reference: patientId
  }
}

function getMedicationGroupIdentifier(pertinentInformation2: PertinentInformation2) {
  return {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: pertinentInformation2.pertinentPrescriptionID.value._attributes.extension
  }
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
