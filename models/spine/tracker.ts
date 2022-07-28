export interface GenericTrackerRequest {
  message_id: string
  from_asid: string
  to_asid: string
}
export interface PrescriptionMetadataRequest extends GenericTrackerRequest {
  prescription_id: string
  repeat_number: string
}

export interface PrescriptionDocumentRequest extends GenericTrackerRequest {
  prescription_id: string
  document_key: string
}
