import {DetailPrescription, DetailTrackerResponse} from "./spine-model"
import {fhir} from "@models"
import * as uuid from "uuid"
import {convertResourceToBundleEntry} from "../../translation/response/common"
import moment from "moment"
import {HL7_V3_DATE_TIME_FORMAT, ISO_DATE_FORMAT} from "../../translation/common/dateTime"

export function convertSpineResponseToFhir(spineResponse: unknown): fhir.Bundle | fhir.OperationOutcome {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {statusCode, reason, version, ...prescriptions} = spineResponse as DetailTrackerResponse

  if (statusCode !== "0") {
    return fhir.createOperationOutcome([fhir.createOperationOutcomeIssue(
      fhir.IssueCodes.INVALID,
      "error",
      fhir.createCodeableConcept(
        "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        "INVALID",
        reason
      )
    )])
  }

  const tasks = Object.entries(prescriptions).map(
    ([id, detailPrescription]) => convertPrescriptionToTask(id, detailPrescription)
  )

  return {
    resourceType: "Bundle",
    type: "searchset",
    total: tasks.length,
    entry: tasks.map(convertResourceToBundleEntry)
  }
}

function convertPrescriptionToTask(prescriptionId: string, prescription: DetailPrescription): fhir.Task {
  const hasBeenDispensed = prescription.dispensingPharmacy.ods
  const owner = hasBeenDispensed ? prescription.dispensingPharmacy : prescription.nominatedPharmacy
  const {status, businessStatus} = getStatusCodesFromDisplay(prescription.prescriptionStatus)
  const id = uuid.v4()

  const task: fhir.Task = {
    resourceType: "Task",
    id: id,
    extension: [createCourseOfTherapyTypeExtension(prescription.prescriptionTreatmentType)],
    identifier: [fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", id)],
    status: status,
    businessStatus: fhir.createCodeableConcept(
      "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      businessStatus,
      prescription.prescriptionStatus
    ),
    intent: fhir.TaskIntent.ORDER,
    code: fhir.createCodeableConcept(
      "http://hl7.org/fhir/CodeSystem/task-code",
      "fulfill",
      "Fulfill the focal request"
    ),
    focus: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-number", prescriptionId)
    ),
    for: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/nhs-number", prescription.patientNhsNumber)
    ),
    authoredOn: convertToFhirDate(prescription.prescriptionIssueDate),
    requester: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", prescription.prescriber.ods),
      prescription.prescriber.name
    ),
    owner: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", owner.ods),
      owner.name
    )
  }

  if (prescription.repeatInstance.totalAuthorised !== "1") {
    task.extension.push(
      createRepeatInfoExtension(prescription.repeatInstance.currentIssue, prescription.repeatInstance.totalAuthorised)
    )
  }

  const lineItemIds = Object.keys(prescription.lineItems)
  task.input = lineItemIds.map(lineItemId => convertLineItemToInput(lineItemId, prescription))
  task.output = lineItemIds.map(lineItemId => convertLineItemToOutput(lineItemId, prescription))
  return task
}

function getStatusCodesFromDisplay(display: string): { status: fhir.TaskStatus, businessStatus: string } {
  switch (display) {
    case "To be Dispensed":
    case "To Be Dispensed":
      return {status: fhir.TaskStatus.REQUESTED, businessStatus: "0001"}
    case "With Dispenser":
      return {status: fhir.TaskStatus.ACCEPTED, businessStatus: "0002"}
    case "With Dispenser - Active":
      return {status: fhir.TaskStatus.IN_PROGRESS, businessStatus: "0003"}
    case "Expired":
      return {status: fhir.TaskStatus.FAILED, businessStatus: "0004"}
    case "Cancelled":
      return {status: fhir.TaskStatus.CANCELLED, businessStatus: "0005"}
    case "Dispensed":
      return {status: fhir.TaskStatus.COMPLETED, businessStatus: "0006"}
    case "Not Dispensed":
      return {status: fhir.TaskStatus.COMPLETED, businessStatus: "0007"}
    default:
      throw new Error("Unexpected Status Code from Spine")
  }
}

function createCourseOfTherapyTypeExtension(treatmentType: string): fhir.ExtensionExtension<fhir.CodingExtension> {
  let code, display
  switch (treatmentType) {
    case "Acute Prescription":
      code = fhir.CourseOfTherapyTypeCode.ACUTE
      display = "Short course (acute) therapy"
      break
    case "Repeat Prescribing":
      code = fhir.CourseOfTherapyTypeCode.CONTINUOUS
      display = "Continuous long term therapy"
      break
    case "Repeat Dispensing":
      code = fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING
      display = "Continuous long term (repeat dispensing)"
      break
  }
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription",
    extension:  [{
      url: "courseOfTherapyType",
      valueCoding: {
        system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
        code: code,
        display: display
      }
    }]
  }
}

function convertToFhirDate(dateString: string) {
  return moment.utc(dateString, HL7_V3_DATE_TIME_FORMAT).format(ISO_DATE_FORMAT)
}

function createRepeatInfoExtension(currentIssue: string, totalAuthorised: string) {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    extension: [
      {
        url: "numberOfRepeatsAllowed",
        valueUnsignedInt: totalAuthorised
      },
      {
        url: "numberOfRepeatsIssued",
        valueUnsignedInt: currentIssue
      }
    ]
  }
}

function convertLineItemToInput(lineItemId: string, prescription: DetailPrescription) {
  const lineItem = prescription.lineItems[lineItemId]
  const taskInput: fhir.TaskInput = {
    type: fhir.createCodeableConcept("http://snomed.info/sct", "16076005", "Prescription"),
    valueReference: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", lineItemId.toLowerCase())
    )
  }

  const dispensingInformationExtension = []
  if (prescription.prescriptionDispensedDate !== "False") {
    dispensingInformationExtension.push({
      url: "dateLastDispensed",
      valueDate: convertToFhirDate(prescription.prescriptionDispensedDate)
    })
  }

  if (lineItem.itemStatus) {
    const {businessStatus} = getStatusCodesFromDisplay(lineItem.itemStatus)
    dispensingInformationExtension.push({
      url: "dispenseStatus",
      valueCoding: fhir.createCoding(
        "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
        businessStatus,
        lineItem.itemStatus
      )
    })
  }

  if (dispensingInformationExtension.length > 0) {
    taskInput.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
      extension: dispensingInformationExtension
    }]
  }

  return taskInput
}

function convertLineItemToOutput(lineItemId: string, prescription: DetailPrescription) {
  const lineItem = prescription.lineItems[lineItemId]
  const taskOutput: fhir.TaskOutput = {
    type: fhir.createCodeableConcept("http://snomed.info/sct", lineItem.code, lineItem.description),
    valueReference: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-dispense-item-number", lineItemId.toLowerCase())
    )
  }
  const releaseInformationExtensions = []
  if (prescription.prescriptionLastIssueDispensedDate !== "False") {
    releaseInformationExtensions.push({
      url: "dateLastIssuedDispensed",
      valueDate: convertToFhirDate(prescription.prescriptionLastIssueDispensedDate)
    })
  }
  if (prescription.prescriptionDownloadDate) {
    releaseInformationExtensions.push({
      url: "dateDownloaded",
      valueDate: convertToFhirDate(prescription.prescriptionDownloadDate)
    })
  }
  if (prescription.prescriptionClaimedDate) {
    releaseInformationExtensions.push({
      url: "dateClaimed",
      valueDate: convertToFhirDate(prescription.prescriptionClaimedDate)
    })
  }

  if (releaseInformationExtensions.length > 0) {
    taskOutput.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingReleaseInformation",
      extension: releaseInformationExtensions
    }]
  }

  return taskOutput
}
