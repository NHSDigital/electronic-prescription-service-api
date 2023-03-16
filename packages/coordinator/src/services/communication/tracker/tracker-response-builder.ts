import {spine, hl7V3} from "@models"
import pino from "pino"
import {extractHl7v3PrescriptionFromMessage, extractSpineErrorDescription} from "./spine-response-parser"

enum TrackerErrorString {
  FAILED_TRACKER_REQUEST = "Failed to retrieve prescription from Spine",
  FAILED_PRESCRIPTION_EXTRACT = "Failed to extract prescription from Spine response",
  FAILED_PRESCRIPTION_VERIFY = "Failed to verify prescription from Spine",
  FAILED_ERROR_RESPONSE_EXTRACT = "Could not extract error details from Spine response"
}

interface TrackerError {
  errorMessage: TrackerErrorString
  errorDetails?: Array<string>
}

interface TrackerResponse {
  statusCode: number
  prescription?: hl7V3.ParentPrescription
  error?: TrackerError
}

const createTrackerError = (error: TrackerErrorString, details?: string | Array<string>): TrackerError => {
  let messageDetails: Array<string>
  if(Array.isArray(details)){
    messageDetails = details
  }else{
    messageDetails = details ? [details] : []
  }

  return {
    errorMessage: error,
    errorDetails: messageDetails
  }
}

const extractPrescription = (responseBody: string, logger: pino.Logger): hl7V3.ParentPrescription => {
  try {
    return extractHl7v3PrescriptionFromMessage(responseBody, logger)
  } catch (error) {
    logger.error(`${TrackerErrorString.FAILED_PRESCRIPTION_EXTRACT}: ${error}`)
  }
}

const tryExtractErrorMessage = (responseBody: string, logger: pino.Logger): string => {
  try {
    return extractSpineErrorDescription(responseBody)
  } catch (error) {
    logger.error(`${TrackerErrorString.FAILED_ERROR_RESPONSE_EXTRACT}: ${error}`)
  }
}

const createTrackerResponse = (
  spineResponse: spine.SpineDirectResponse<string>,
  logger: pino.Logger
): TrackerResponse => {
  const prescription = extractPrescription(spineResponse.body, logger)
  if (prescription) {
    logger.info(`Successfully extracted prescription ${prescription.id._attributes.root}`)
    return {
      statusCode: 200,
      prescription: prescription
    }
  }

  // TODO: Check which errors should/shouldn't be passed from Spine to user
  const failureDescription = tryExtractErrorMessage(spineResponse.body, logger) ?? spineResponse.body
  const error = createTrackerError(
    TrackerErrorString.FAILED_PRESCRIPTION_EXTRACT,
    failureDescription
  )

  return {
    statusCode: 500,
    error
  }
}

export {
  TrackerError,
  TrackerErrorString,
  TrackerResponse,
  createTrackerResponse,
  createTrackerError
}
