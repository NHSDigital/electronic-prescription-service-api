import * as codes from "./codes"
import * as agentPerson from "./agent-person"

export interface PrescriptionReleaseRejectRoot {
  PrescriptionReleaseReject: PrescriptionReleaseRejection
}

export interface PrescriptionReleaseRejection {
  pertinentInformation: PrescriptionReleaseRejectionPertinentInformation
}

export interface PrescriptionReleaseRejectionPertinentInformation {
  pertinentRejectionReason : {
    value: codes.PrescriptionReleaseRejectionReason
    performer?: agentPerson.Performer
  }
}
