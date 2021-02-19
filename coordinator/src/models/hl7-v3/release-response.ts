import * as core from "./core"
import * as codes from "./codes"
import * as parentPrescription from "./parent-prescription"

export interface PrescriptionReleaseResponse {
  id: codes.GlobalIdentifier
  effectiveTime: core.Timestamp
  component: Array<PrescriptionReleaseResponseComponent> | PrescriptionReleaseResponseComponent
  pertinentInformation: [
    PrescriptionReleaseResponsePertinentInformation,
    PrescriptionReleaseResponsePertinentInformation
  ]
  inFulfillmentOf: PrescriptionReleaseResponseInFulfillmentOf
}

export interface PrescriptionReleaseResponseComponent {
  templateId: codes.TemplateIdentifier
  ParentPrescription: parentPrescription.ParentPrescription
}

export interface PrescriptionReleaseResponsePertinentInformation {
  pertinentBatchInfo: {
    value: core.NumericValue
  }
}

export interface PrescriptionReleaseResponseInFulfillmentOf {
  priorDownloadRequestRef: {
    id: codes.GlobalIdentifier
  }
}
