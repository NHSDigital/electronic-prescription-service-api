import {spine} from "@models"
import fs from "fs"
import Mustache from "mustache"
import path from "path"

const prescriptionMetadataRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../../resources/get_prescription_metadata_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

const prescriptionDocumentRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../../resources/get_prescription_document_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

export function getPrescriptionMetadataRequest(request: spine.PrescriptionMetadataRequest): string {
  return Mustache.render(prescriptionMetadataRequestTemplate, request)
}

export function getPrescriptionDocumentRequest(request: spine.PrescriptionDocumentRequest): string {
  return Mustache.render(prescriptionDocumentRequestTemplate, request)
}

