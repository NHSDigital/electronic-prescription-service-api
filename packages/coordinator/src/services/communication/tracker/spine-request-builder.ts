import {spine} from "@models"
import fs from "fs"
import moment from "moment"
import Mustache from "mustache"
import path from "path"
import {HL7_V3_DATE_TIME_FORMAT} from "../../translation/common/dateTime"

const prescriptionMetadataRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../../resources/get_prescription_metadata_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

const prescriptionDocumentRequestTemplate = fs.readFileSync(
  path.join(__dirname, "../../../resources/get_prescription_document_request.mustache"),
  "utf-8"
).replace(/\n/g, "\r\n")

export class PrescriptionRequestBuilder {
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

  private makePrescriptionTrackerRequest(): spine.PrescriptionTrackerRequest {
    return {
      message_id: this.message_id,
      creation_time: moment.utc(HL7_V3_DATE_TIME_FORMAT).toString(),
      from_asid: this.from_asid,
      to_asid: this.to_asid,
      prescription_id: this.prescription_id
    }
  }

  makePrescriptionMetadataRequest(repeat_number: string): spine.PrescriptionMetadataRequest {
    return {
      ...this.makePrescriptionTrackerRequest(),
      repeat_number: repeat_number
    }
  }

  makePrescriptionDocumentRequest(document_key: string): spine.PrescriptionDocumentRequest {
    return {
      ...this.makePrescriptionTrackerRequest(),
      document_key: document_key
    }
  }
}

// eslint-disable-next-line max-len
function isPrescriptionMetadataRequest(req: spine.PrescriptionTrackerRequest): req is spine.PrescriptionMetadataRequest {
  return (req as spine.PrescriptionMetadataRequest).repeat_number !== undefined
}

// eslint-disable-next-line max-len
function isPrescriptionDocumentRequest(req: spine.PrescriptionTrackerRequest): req is spine.PrescriptionDocumentRequest {
  return (req as spine.PrescriptionDocumentRequest).document_key !== undefined
}

export const makeTrackerSoapMessageRequest = (
  request: spine.PrescriptionMetadataRequest | spine.PrescriptionDocumentRequest
): string => {
  if (isPrescriptionMetadataRequest(request)) {
    return Mustache.render(prescriptionMetadataRequestTemplate, {
      ...request,
      repeat_number: request.repeat_number
    })
  } else if (isPrescriptionDocumentRequest(request)) {
    return Mustache.render(prescriptionDocumentRequestTemplate, {
      ...request,
      document_key: request.document_key
    })
  } else {
    throw new Error(`Got invalid prescription request ${request}`)
  }
}
