import {fhir, spine} from "@models"
import * as uuid from "uuid"
import {convertResourceToBundleEntry} from "../common"
import moment from "moment"
import {HL7_V3_DATE_TIME_FORMAT, ISO_DATE_FORMAT} from "../../common/dateTime"
import {LosslessNumber} from "lossless-json"
import {RawDetailTrackerResponse} from "../../../../../../models/spine"

const STATUS_CODE_SUCCESS = "0"

export function convertRawResponseToDetailTrackerResponse(
  rawResponse: RawDetailTrackerResponse
): spine.DetailTrackerResponse {
  const {version, reason, statusCode, ...prescriptions} = rawResponse
  return {version, reason, statusCode, prescriptions}
}

export function convertSpineTrackerResponseToFhir(
  {statusCode, reason, prescriptions}: spine.SummaryTrackerResponse | spine.DetailTrackerResponse
): fhir.Bundle | fhir.OperationOutcome {
  if (statusCode !== STATUS_CODE_SUCCESS) {
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
    ([id, prescription]) => convertPrescriptionToTask(id, prescription)
  )

  return {
    resourceType: "Bundle",
    type: "searchset",
    total: tasks.length,
    entry: tasks.map(convertResourceToBundleEntry)
  }
}

function convertPrescriptionToTask(
  prescriptionId: string,
  prescription: spine.DetailPrescription | spine.SummaryPrescription
): fhir.Task {
  const {status, businessStatus} = getPrescriptionStatusCodesFromDisplay(prescription.prescriptionStatus)
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
    focus: fhir.createIdentifierReference(fhir.createIdentifier(
      "https://fhir.nhs.uk/Id/prescription-order-number",
      prescriptionId
    )),
    for: fhir.createIdentifierReference(fhir.createIdentifier(
      "https://fhir.nhs.uk/Id/nhs-number",
      prescription.patientNhsNumber
    )),
    authoredOn: convertToFhirDate(prescription.prescriptionIssueDate)
  }

  //TODO - owner is mandatory in the profile but we don't get it back in the summary response
  if ("dispensingPharmacy" in prescription) {
    const hasBeenDispensed = prescription.dispensingPharmacy.ods
    const owner = hasBeenDispensed ? prescription.dispensingPharmacy : prescription.nominatedPharmacy
    task.owner = fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", owner.ods),
      owner.name
    )
  }

  if ("prescriber" in prescription) {
    task.requester = fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", prescription.prescriber.ods),
      prescription.prescriber.name
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

function getPrescriptionStatusCodesFromDisplay(display: string): { status: fhir.TaskStatus, businessStatus: string } {
  //TODO - some of these cases aren't in the code system, but can be produced by Spine
  switch (display) {
    case "Awaiting Release Ready":
      return {status: fhir.TaskStatus.REQUESTED, businessStatus: "0000"}
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
    case "Claimed":
      return {status: fhir.TaskStatus.COMPLETED, businessStatus: "0008"}
    case "No-Claimed":
      return {status: fhir.TaskStatus.COMPLETED, businessStatus: "0009"}
    case "Repeat Dispense future instance":
      return {status: fhir.TaskStatus.REQUESTED, businessStatus: "9000"}
    case "Prescription future instance":
      return {status: fhir.TaskStatus.REQUESTED, businessStatus: "9001"}
    case "Cancelled future instance":
      return {status: fhir.TaskStatus.CANCELLED, businessStatus: "9005"}
    default:
      throw new Error("Unexpected prescription status from Spine: " + display)
  }
}

function getLineItemStatusCodeFromDisplay(display: string): string {
  switch (display) {
    case "Dispensed":
      return "0001"
    case "Not Dispensed":
      return "0002"
    case "Dispensed - Partial":
      return "0003"
    case "Not Dispensed - Owing":
      return "0004"
    case "Cancelled":
      return "0005"
    case "Expired":
      return "0006"
    case "To be Dispensed":
      return "0007"
    case "With Dispenser":
      return "0008"
    default:
      throw new Error("Unexpected line item status from Spine: " + display)
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
    default:
      throw new Error("Unexpected treatment type from Spine: " + treatmentType)
  }
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription",
    extension: [{
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
        valueInteger: new LosslessNumber(totalAuthorised)
      },
      {
        url: "numberOfRepeatsIssued",
        valueInteger: new LosslessNumber(currentIssue)
      }
    ]
  }
}

function convertLineItemToInput(
  lineItemId: string,
  prescription: spine.SummaryPrescription | spine.DetailPrescription
) {
  const lineItem = prescription.lineItems[lineItemId]
  const taskInput: fhir.TaskInput = {
    type: fhir.createCodeableConcept("http://snomed.info/sct", "16076005", "Prescription"),
    valueReference: fhir.createIdentifierReference(
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", lineItemId.toLowerCase()),
      undefined,
      "MedicationRequest"
    )
  }

  const dispensingInformationExtension = []
  if ("prescriptionDispensedDate" in prescription
    && prescription.prescriptionDispensedDate
    && prescription.prescriptionDispensedDate !== "False") {
    dispensingInformationExtension.push({
      url: "dateLastDispensed",
      valueDate: convertToFhirDate(prescription.prescriptionDispensedDate)
    })
  }

  if (typeof lineItem === "object" && lineItem.itemStatus) {
    const statusCode = getLineItemStatusCodeFromDisplay(lineItem.itemStatus)
    dispensingInformationExtension.push({
      url: "dispenseStatus",
      valueCoding: fhir.createCoding(
        "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
        statusCode,
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

function convertLineItemToOutput(
  lineItemId: string,
  prescription: spine.SummaryPrescription | spine.DetailPrescription
) {
  const taskOutput: fhir.TaskOutput = {
    type: fhir.createCodeableConcept("http://snomed.info/sct", "373784005", "Dispensing medication"),
    valueReference: fhir.createIdentifierReference(
      //TODO - this should be a prescription-dispense-item-number but we don't get one back in the response
      fhir.createIdentifier("https://fhir.nhs.uk/Id/prescription-order-item-number", lineItemId.toLowerCase()),
      undefined,
      "MedicationDispense"
    )
  }
  const releaseInformationExtensions = []
  if ("prescriptionLastIssueDispensedDate" in prescription
    && prescription.prescriptionLastIssueDispensedDate
    && prescription.prescriptionLastIssueDispensedDate !== "False"
  ) {
    releaseInformationExtensions.push({
      url: "dateLastIssuedDispensed",
      valueDate: convertToFhirDate(prescription.prescriptionLastIssueDispensedDate)
    })
  }
  if ("prescriptionDownloadDate" in prescription && prescription.prescriptionDownloadDate) {
    releaseInformationExtensions.push({
      url: "dateDownloaded",
      valueDate: convertToFhirDate(prescription.prescriptionDownloadDate)
    })
  }
  if ("prescriptionClaimedDate" in prescription && prescription.prescriptionClaimedDate) {
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
