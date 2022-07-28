interface GenericTrackerRequest {
  message_id: string
  from_asid: string
  to_asid: string
}

export interface GetPrescriptionMetadataRequest extends GenericTrackerRequest {
  prescription_id: string
  repeat_number: string
}

interface GetPrescriptionDocumentRequest extends GenericTrackerRequest {
  prescription_id: string
  document_key: string
}

export function buildPrescriptionMetadataRequest(
  messageId: string,
  prescriptionId: string,
  repeatNumber: string
): GetPrescriptionMetadataRequest {
  return {
    ...buildGenericTrackerRequest(messageId),
    prescription_id: prescriptionId,
    repeat_number: repeatNumber
  }
}

export function buildPrescriptionDocumentRequest(
  messageId: string,
  prescriptionId: string,
  documentKey: string
): GetPrescriptionDocumentRequest {
  return {
    ...buildGenericTrackerRequest(messageId),
    prescription_id: prescriptionId,
    document_key: documentKey
  }
}

function buildGenericTrackerRequest(messageId: string): GenericTrackerRequest {
  return {
    message_id: messageId,
    from_asid: process.env.TRACKER_FROM_ASID,
    to_asid: process.env.TRACKER_TO_ASID,
  }
}