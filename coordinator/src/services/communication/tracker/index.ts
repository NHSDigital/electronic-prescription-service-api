import pino from "pino"
import Hapi from "hapi__hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {fhir} from "@models"

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

export function convertDetailedJsonResponseToFhirTask(response: DetailTrackerResponse): fhir.Task {
  const prescriptionIds = Object.keys(response).filter(fieldName => isPrescriptionField(response, fieldName))
  const prescriptions = prescriptionIds.map(id => response[id])

  return {
    resourceType: "Task",
    identifier: undefined,
    groupIdentifier: undefined,
    status: undefined,
    intent: undefined,
    focus: undefined,
    for: undefined,
    authoredOn: undefined,
    reasonCode: undefined,
    owner: undefined
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
