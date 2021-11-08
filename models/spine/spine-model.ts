//TODO - move everything in this file to the models section of the repo

interface TrackerResponse {
  version: string
  reason: string
  statusCode: string
}

export interface SummaryTrackerResponse extends TrackerResponse {
  prescriptions: Record<string, SummaryPrescription>
}

export interface DetailTrackerResponse extends TrackerResponse {
  prescriptions: Record<string, DetailPrescription>
}

interface Prescription {
  lastEventDate: string
  prescriptionIssueDate: string
  patientNhsNumber: string
  epsVersion: string
  repeatInstance: {
    currentIssue: string
    totalAuthorised: string
  }
  pendingCancellations: string
  prescriptionTreatmentType: string
  prescriptionStatus: string
}

export interface SummaryPrescription extends Prescription {
  lineItems: Record<string, string>
}

export interface DetailPrescription extends Prescription {
  prescriptionDownloadDate: string
  prescriptionDispensedDate: string
  prescriptionClaimedDate: string
  prescriptionLastIssueDispensedDate: string
  prescriber: Organization
  nominatedPharmacy: Organization
  dispensingPharmacy: Organization
  lineItems: Record<string, LineItemDetail>
}

interface Organization {
  name: string
  address: string
  phone: string
  ods: string
}

export interface LineItemDetail {
  description: string
  quantity: string
  uom: string
  dosage: string
  itemStatus: string
  code: string
}
