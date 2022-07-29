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

export class GenericTrackerRequest implements spine.GenericTrackerRequest {
  readonly message_id: string
  readonly from_asid: string
  readonly to_asid: string
  readonly prescription_id: string

  constructor(
    message_id: string,
    prescription_id: string
  ) {
    this.message_id = message_id
    this.prescription_id = prescription_id
    this.from_asid = process.env.TRACKER_FROM_ASID
    this.to_asid = process.env.TRACKER_TO_ASID
  }

  makePrescriptionMetadataRequest(repeat_number: string): spine.PrescriptionMetadataRequest {
    return {
      message_id: this.message_id,
      from_asid: this.from_asid,
      to_asid: this.to_asid,
      prescription_id: this.prescription_id,
      repeat_number: repeat_number
    }
  }

  makePrescriptionDocumentRequest(document_key: string): spine.PrescriptionDocumentRequest {
    return {
      message_id: this.message_id,
      from_asid: this.from_asid,
      to_asid: this.to_asid,
      prescription_id: this.prescription_id,
      document_key: document_key
    }
  }
}

export const makeTrackerSoapMessageRequest = (
  request: spine.PrescriptionMetadataRequest | spine.PrescriptionDocumentRequest
): string => {
  if (Object.prototype.hasOwnProperty.call(request, "repeat_number")) {
    // Prescription metadata request
    return Mustache.render(prescriptionMetadataRequestTemplate, {
      ...request,
      repeat_number: (request as spine.PrescriptionMetadataRequest).repeat_number
    })
  } else if (Object.prototype.hasOwnProperty.call(request, "document_key")) {
    // Prescription document request
    return Mustache.render(prescriptionDocumentRequestTemplate, {
      ...request,
      document_key: (request as spine.PrescriptionDocumentRequest).document_key
    })
  } else {
    throw `Got invalid prescription request ${request}`
  }
}
