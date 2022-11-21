export interface PrescriptionTrackerRequest {
  message_id: string
  creation_time: string
  from_asid: string
  to_asid: string
  prescription_id: string
}
export interface PrescriptionMetadataRequest extends PrescriptionTrackerRequest {
  repeat_number: string
}

export interface PrescriptionDocumentRequest extends PrescriptionTrackerRequest {
  document_key: string
}
