import * as fhir from "../../../models/fhir/fhir-resources"
import {
  CancellationResponse,
  PertinentInformation1,
  PertinentInformation3
} from "../../../models/hl7-v3/hl7-v3-spine-response"
import moment from "moment"
import {generateFullUrl} from "./common"

export function createMedicationRequest(
  cancellationResponse: CancellationResponse,
  practitionerRoleId: string,
  patientId: string
): fhir.MedicationRequest {
  const medicationRequest = {resourceType: "MedicationRequest"} as fhir.MedicationRequest
  const pertinentInformation1 = cancellationResponse.pertinentInformation1
  const pertinentInformation3 = cancellationResponse.pertinentInformation3
  medicationRequest.extension = createExtensions(pertinentInformation3, practitionerRoleId)
  medicationRequest.identifier = createIdentifier(pertinentInformation1)
  // medicationRequest.status = ""
  medicationRequest.intent = "order"
  medicationRequest.medicationCodeableConcept = getMedicationCodeableConcept()
  medicationRequest.subject = createSubject(patientId)
  medicationRequest.authoredOn = convertHL7V3DateTimeStringToISODateTime(
    cancellationResponse.effectiveTime._attributes.value
  )
  // medicationRequest.requester = {}
  // medicationRequest.groupIdentifier = {}
  // medicationRequest.dispenseRequest = {}
  return medicationRequest
}

function createExtensions(cancellationPertinentInformation3: PertinentInformation3, practitionerRoleId: string) {
  const cancellationCode = cancellationPertinentInformation3.pertinentResponse.value._attributes.code
  const cancellationDisplay = cancellationPertinentInformation3.pertinentResponse.value._attributes.displayName
  const {fhirCode, fhirDisplay} = getCodeAndDisplay(cancellationCode, cancellationDisplay)

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
        "reference": generateFullUrl(practitionerRoleId)
      // "display": "DR SAZ RAZ"
      }
    }
  ]
}

function getCodeAndDisplay(code: string, display: string) {
  const displayArray = display.split("-")
  switch (code) {
  case "0001":
    return {fhirCode: "R-0001", fhirDisplay: "Prescription/item was cancelled"}
  case "0002":
    return {fhirCode: "R-0002", fhirDisplay: "Prescription/item was not cancelled – With dispenser"}
  case "0003":
    return {fhirCode: "R-0003", fhirDisplay: "Prescription item was not cancelled – With dispenser active"}
  case "0004":
    return {fhirCode: "R-0004", fhirDisplay: "Prescription/item was not cancelled – Dispensed to Patient"}
  case "0005":
    return {fhirCode: "R-0005", fhirDisplay: "Prescription item had expired"}
  case "0006":
    return {fhirCode: "R-0006", fhirDisplay: "Prescription/item had already been cancelled"}
  case "0007":
    return {fhirCode: "R-0007", fhirDisplay: "Prescription/item cancellation requested by another prescriber"}
  case "0008":
    return {fhirCode: "R-0008", fhirDisplay: "Prescription/item not found"}
  case "0009":
    return {fhirCode: "R-0009", fhirDisplay: "Cancellation functionality disabled in Spine"}
  //TODO ticket AEA-683 relates to this missing code
  case "0010":
    return {fhirCode: "", fhirDisplay: ""}
  case "5000":
    return {fhirCode: "R-5000", fhirDisplay: `Unable to process message.${displayArray[1]}`}
  case "5888":
    return {fhirCode: "R-5888", fhirDisplay: "Invalid message"}
  default:
    //TODO error?
    return {}
  }
}

function createIdentifier(pertinentInformation1: PertinentInformation1) {
  const id = pertinentInformation1.pertinentLineItemRef.id._attributes.root
  return [{system: id.toLocaleLowerCase(), value: "https://fhir.nhs.uk/Id/prescription-order-item-number"}]
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

function convertHL7V3DateTimeToMoment(hl7Date: string) {
  return moment(hl7Date, "YYYYMMDDhhmmss")
}

function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format("YYYY-MM-DD[T]hh:mm:ssZ")
}

function convertHL7V3DateTimeStringToISODateTime(hl7Date: string): string {
  const dateTimeMoment = convertHL7V3DateTimeToMoment(hl7Date)
  return convertMomentToISODateTime(dateTimeMoment)
}
