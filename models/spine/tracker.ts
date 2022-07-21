export interface GenericTrackerRequest {
  message_id: string
  from_asid: string
  to_asid: string
}
export interface TrackerRequest extends GenericTrackerRequest {
  prescription_id: string
  repeat_number: string
  document_key: string
}

export interface GetPrescriptionDocumentRequest extends GenericTrackerRequest {
  prescription_id: string
  document_key: string
}
