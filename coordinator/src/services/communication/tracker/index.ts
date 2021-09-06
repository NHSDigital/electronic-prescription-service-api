import pino from "pino"
import Hapi from "hapi__hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {fhir} from "@models"
import * as uuid from "uuid"

interface Prescription {
  lastEventDate: string
  prescriptionIssueDate: string
  patientNhsNumber: string
  epsVersion: string
  repeatInstance: {
    currentIssue: string
    totalAuthorised: string
  }
  pendingCancellations: boolean
  prescriptionTreatmentType: string
  prescriptionStatus: string
}

interface SummaryPrescription extends Prescription {
  lineItems: { [lineItemId: string]: string }
}

interface DetailPrescription extends Prescription {
  prescriptionDownloadDate: string
  prescriptionDispenseDate: string
  prescriptionClaimedDate: string
  prescriptionLastIssueDispensedDate: string
  prescriber: Organization
  nominatedPharmacy: Organization
  dispensingPharmacy: Organization
  lineItems: { [lineItemId: string]: LineItemDetail }
}

interface Organization {
  name: string
  address: string
  phone: string
  ods: string
}

interface LineItemDetail {
  description: string
  quantity: string
  uom: string
  dosage: string
  itemStatus: string
  code: string
}

interface Prescriptions<T extends Prescription> {
  [prescriptionShortFormId: string]: T
}

export interface SummaryTrackerResponse {
  version: string
  reason: string
  statusCode: string
  prescriptions: Prescriptions<SummaryPrescription>
}

export type DetailTrackerResponse = {
  version: string
  reason: string
  statusCode: string
} & Prescriptions<DetailPrescription>

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

function convertTaskInput (lintItem: LineItemDetail): fhir.TaskInput {

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
        createDispensingInformationExtension(lastIssueDispensedDate)
      ],
      type: CODEABLE_CONCEPT_PRESCRIPTION,
      valueReference: fhir.createIdentifierReference(
        fhir.createIdentifier("https://tools.ietf.org/html/rfc4122", uuid.v4())
      )
    }],
    output: undefined
  }
}

export interface TrackerClient {
  getPrescription(
    prescriptionId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<DetailTrackerResponse>

}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
