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
  lineItems: { [lineItemId: string]: string }
}

export interface TrackerJsonResponse {
  version: string
  reason: string
  statusCode: string
  prescriptions: { [prescriptionShortFormId: string]: Prescription }
}

//TODO - translate
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export function convertWeirdJsonResponseToFhirTask(response: TrackerJsonResponse): fhir.Task {
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
  ): Promise<TrackerJsonResponse>

}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
