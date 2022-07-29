export interface GenericTrackerRequest {
  message_id: string
  from_asid: string
  to_asid: string
  prescription_id: string
}
export interface PrescriptionMetadataRequest extends GenericTrackerRequest {
  repeat_number: string
}

export interface PrescriptionDocumentRequest extends GenericTrackerRequest {
  document_key: string
}
