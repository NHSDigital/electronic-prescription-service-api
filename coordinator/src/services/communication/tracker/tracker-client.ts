import {hl7V3, spine} from "@models"
import pino from "pino"
import {SpineClient, spineClient} from "../spine-client"
import {PrescriptionRequestBuilder, makeTrackerSoapMessageRequest} from "./tracker-request-builder"
import {extractHl7v3PrescriptionFromMessage, extractPrescriptionDocumentKey} from "./tracker-response-parser"

interface TrackerResponse {
    statusCode: number
    prescription?: hl7V3.ParentPrescription
    error?: TrackerError
}

interface TrackerError {
    errorCode: string
    errorMessage: string
}

export interface TrackerClient {
  track(
    request_id: string,
    prescription_id: string,
    repeat_number: string,
    logger: pino.BaseLogger
  ): Promise<TrackerResponse>
}

class LiveTrackerClient implements TrackerClient {
    private readonly spineClient: SpineClient

    constructor() {
      this.spineClient = spineClient
    }

    // eslint-disable-next-line max-len
    async track(
      request_id: string,
      prescription_id: string,
      repeat_number: string,
      logger: pino.Logger
    ): Promise<TrackerResponse> {
      const requestBuilder = new PrescriptionRequestBuilder(request_id, prescription_id)
      const moduleLogger = logger.child({module: "TrackerClient", ...requestBuilder})

      try {
        // Prescription Metadata - QURX_IN000005UK99
        const metadataRequest = requestBuilder.makePrescriptionMetadataRequest(repeat_number)
        const metadataResponse = await this.getPrescriptionMetadata(metadataRequest, moduleLogger)

        // Prescription Document - GET_PRESCRIPTION_DOCUMENT_INUK01
        const prescriptionDocumentKey = extractPrescriptionDocumentKey(metadataResponse.body)
        const documentRequest = requestBuilder.makePrescriptionDocumentRequest(prescriptionDocumentKey)
        const documentResponse = await this.getPrescriptionDocument(documentRequest, moduleLogger)

        // TODO: verify the message ID we get back from Spine to see if it's the same one we are sending
        return {
          statusCode: documentResponse.statusCode,
          prescription: extractHl7v3PrescriptionFromMessage(documentResponse.body, moduleLogger)
        }

        // TODO: improve error handling
      } catch (error) {
        return {
          statusCode: error.statusCode ?? 500,
          error: {
            errorCode: "PRESCRIPTION_TRACKER_ERROR",
            errorMessage: error.body ?? error.message
          }
        }
      }
    }

    // eslint-disable-next-line max-len
    private async getPrescriptionMetadata(request: spine.PrescriptionMetadataRequest, logger: pino.Logger): Promise<spine.SpineDirectResponse<string>> {
      logger.info(`Tracker - Sending prescription metadata request: ${JSON.stringify(request)}`)

      const trackerRequest: spine.TrackerRequest = {
        name: "prescription metadata",
        body: makeTrackerSoapMessageRequest(request),
        headers: {
          "SOAPAction": "urn:nhs:names:services:mmquery/QURX_IN000005UK99"
        }
      }

      return await this.spineClient.send(trackerRequest, logger) as spine.SpineDirectResponse<string>
    }

    // eslint-disable-next-line max-len
    private async getPrescriptionDocument(request: spine.PrescriptionDocumentRequest, logger: pino.Logger): Promise<spine.SpineDirectResponse<string>> {
      logger.info(`Tracker - Sending prescription document request: ${JSON.stringify(request)}`)

      const trackerRequest: spine.TrackerRequest = {
        name: "prescription document",
        body: makeTrackerSoapMessageRequest(request),
        headers: {
          "SOAPAction": `urn:nhs:names:services:mmquery/GET_PRESCRIPTION_DOCUMENT_INUK01`
        }
      }

      return await this.spineClient.send(trackerRequest, logger) as spine.SpineDirectResponse<string>
    }
}

class SandboxTrackerClient implements TrackerClient {
  track(): Promise<TrackerResponse> {
    return Promise.resolve({
      statusCode: 200,
      prescription: undefined // todo: add hardcoded fhir prescription
    })
  }
}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
