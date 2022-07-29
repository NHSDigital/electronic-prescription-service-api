export interface TrackerRequest {
  message_id: string
  from_asid: string
  to_asid: string
  prescription_id: string
}
export interface PrescriptionMetadataRequest extends TrackerRequest {
  repeat_number: string
}

export interface PrescriptionDocumentRequest extends TrackerRequest {
  document_key: string
}
