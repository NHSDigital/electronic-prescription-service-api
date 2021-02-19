import * as core from "./hl7-v3-datatypes-core"
import * as codes from "./hl7-v3-datatypes-codes"
import {NumericValue} from "./hl7-v3-datatypes-core"
import {ParentPrescription} from "./hl7-v3-prescriptions"

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
  ParentPrescription: ParentPrescription
}

export interface PrescriptionReleaseResponsePertinentInformation {
  pertinentBatchInfo: {
    value: NumericValue
  }
}

export interface PrescriptionReleaseResponseInFulfillmentOf {
  priorDownloadRequestRef: {
    id: codes.GlobalIdentifier
  }
}
