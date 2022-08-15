import {hl7V3} from "@models"
import pino from "pino"
import {SpineDirectResponse} from "../../../../../models/spine"
import {verifySignature} from "../../../services/signature-verification"
import {extractHl7v3PrescriptionFromMessage} from "./tracker-response-parser"

enum TrackerErrorCode {
  FAILED_TRACKER_REQUEST = "Failed to retrieve prescription from Spine",
  FAILED_PRESCRIPTION_EXTRACT = "Failed to extract prescription from Spine response",
  FAILED_PRESCRIPTION_VERIFY = "Failed to verify prescription from Spine"
}

interface TrackerError {
  errorCode: string
  errorMessage: string
  errorMessageDetails: Array<string>
}

interface TrackerResponse {
  statusCode: number
  prescription?: hl7V3.ParentPrescription
  error?: TrackerError
}

type PrescriptionOrError = hl7V3.ParentPrescription | TrackerError
const isError = (data: PrescriptionOrError): data is TrackerError => {
  return (data as TrackerError).errorMessage !== undefined
}

const createTrackerError = (
  errorCode: TrackerErrorCode,
  message: string,
  details?: string | Array<string>
): TrackerError => {
  const messageDetails = details
    ? Array.isArray(details) ? details : [details]
    : []

  return {
    errorCode: errorCode,
    errorMessage: message,
    errorMessageDetails: messageDetails
  }
}

const extractPrescription = (responseBody: string, logger: pino.Logger): PrescriptionOrError => {
  try {
    return extractHl7v3PrescriptionFromMessage(responseBody, logger)
  } catch (error) {
    return createTrackerError(
      TrackerErrorCode.FAILED_PRESCRIPTION_EXTRACT,
      "Failed to extract prescription from Spine response.",
      error
    )
  }
}

const verifyPrescription = (prescription: hl7V3.ParentPrescription): PrescriptionOrError => {
  const verificationErrors = verifySignature(prescription)
  if (verificationErrors.length > 0) {
    return createTrackerError(
      TrackerErrorCode.FAILED_PRESCRIPTION_VERIFY,
      `Signature verification for prescription ${prescription.id} failed.`,
      verificationErrors
    )
  }

  return prescription
}

const createTrackerResponse = (spineResponse: SpineDirectResponse<string>, logger: pino.Logger): TrackerResponse => {
  const prescription = extractPrescription(spineResponse.body, logger)
  if (isError(prescription)) {
    logger.error(`Got invalid prescription from Spine response ${spineResponse}`)
    return {
      statusCode: 500,
      error: prescription
    }
  }

  const verifyPrescriptionResult = verifyPrescription(prescription)
  if (isError(verifyPrescriptionResult)) {
    logger.warn(`Could not verify prescription from Spine: ${verifyPrescriptionResult.errorMessageDetails}`)
    return {
      statusCode: 500,
      prescription: prescription,
      error: verifyPrescriptionResult
    }
  }

  logger.info(`Successfully extracted and verified prescription ${prescription.id}`)
  return {
    statusCode: 200,
    prescription: verifyPrescriptionResult
  }
}

export {
  TrackerError,
  TrackerErrorCode,
  TrackerResponse,
  createTrackerResponse,
  createTrackerError
}
