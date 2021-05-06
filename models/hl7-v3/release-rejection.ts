import * as codes from "./codes"

export interface PrescriptionReleaseRejectRoot {
  PrescriptionReleaseReject: PrescriptionReleaseRejection
}

export interface PrescriptionReleaseRejection {
  pertinentInformation: PrescriptionReleaseRejectionPertinentInformation
}

export interface PrescriptionReleaseRejectionPertinentInformation {
  pertinentRejectionReason : {
    value: codes.PrescriptionReleaseRejectionReason
  }
}
