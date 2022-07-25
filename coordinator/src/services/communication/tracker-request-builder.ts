import Mustache from "mustache"
import fs from "fs"
import path from "path"

const prescriptionMetadataRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../resources/tracker_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

const prescriptionDocumentRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../resources/get_prescription_document_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

export interface GenericPrescriptionRequest {
    message_id: string
    from_asid: string
    to_asid: string
}

export interface PrescriptionMetadataRequest extends GenericPrescriptionRequest {
    prescription_id: string
    repeat_number: string
}

export interface PrescriptionDocumentRequest extends GenericPrescriptionRequest {
    prescription_id: string
    document_key: string
}

export function getPrescriptionMetadataRequest(request: PrescriptionMetadataRequest): string {
  return Mustache.render(prescriptionMetadataRequestTemplate, request)
}

export function getPrescriptionDocumentRequest(request: PrescriptionDocumentRequest): string {
  return Mustache.render(prescriptionDocumentRequestTemplate, request)
}

