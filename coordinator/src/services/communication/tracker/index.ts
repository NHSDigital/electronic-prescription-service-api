import pino from "pino"
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
  lineItems: { [lineItemId: string]: string }
}

export interface WeirdJsonResponse {
  version: string
  reason: string
  statusCode: string
  prescriptions: { [prescriptionShortFormId: string]: Prescription }
}

//TODO - translate
export function convertWeirdJsonResponseToFhirTask(response: WeirdJsonResponse): fhir.Task {
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
  getPrescription(prescriptionId: string, logger: pino.Logger): Promise<WeirdJsonResponse>

}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
