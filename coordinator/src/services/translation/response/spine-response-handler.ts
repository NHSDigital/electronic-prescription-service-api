import {readXmlStripNamespace} from "../../serialisation/xml"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"
import * as cancelResponseTranslator from "./cancellation/cancellation-response"
import * as releaseResponseTranslator from "./release/release-response"
import {toArray} from "../common"
import * as pino from "pino"

export interface TranslatedSpineResponse {
  fhirResponse: fhir.Resource
  statusCode: number
}

export class SpineResponseHandler<T> {
  interactionId: string
  regex: RegExp

  constructor(interactionId: string) {
    this.interactionId = interactionId
    const pattern = `(?=<(hl7:)?${interactionId}[^]*>)([^]*)(?<=</(hl7:)?${interactionId}>)`
    this.regex = new RegExp(pattern)
  }

  handleResponse(spineResponse: string, logger: pino.Logger): TranslatedSpineResponse {
    const sendMessagePayload = this.extractSendMessagePayload(spineResponse)
    if (!sendMessagePayload) {
      return null
    }
    const acknowledgementTypeCode = this.extractAcknowledgementTypeCode(sendMessagePayload)
    if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED) {
      return this.handleSuccessResponse(sendMessagePayload, logger)
    } else if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.ERROR) {
      return this.handleErrorResponse(sendMessagePayload, logger)
    } else if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.REJECTED) {
      return this.handleRejectionResponse(sendMessagePayload, logger)
    } else {
      logger.error("Unhandled acknowledgement type code " + acknowledgementTypeCode)
      return SpineResponseHandler.createServerErrorResponse()
    }
  }

  extractSendMessagePayload(spineResponse: string): hl7V3.SendMessagePayload<T> {
    const extractedXml = this.regex.exec(spineResponse)
    if (!extractedXml) {
      return null
    }
    const parsedMessage = readXmlStripNamespace(extractedXml[0]) as hl7V3.WrapperRoot<T>
    return parsedMessage[this.interactionId]
  }

  private extractAcknowledgementTypeCode(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    return sendMessagePayload.acknowledgement._attributes.typeCode
  }

  private extractRejectionCodes(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    const acknowledgementDetails = sendMessagePayload.acknowledgement.acknowledgementDetail ?? []
    return toArray(acknowledgementDetails).map(acknowledgementDetail => acknowledgementDetail.code)
  }

  private extractErrorCodes(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    const reasons = sendMessagePayload.ControlActEvent.reason ?? []
    return toArray(reasons).map(reason => reason.justifyingDetectedIssueEvent.code)
  }

  static createSuccessResponse(): TranslatedSpineResponse {
    return {
      statusCode: 200,
      fhirResponse: fhir.createOperationOutcome([{
        code: "informational",
        severity: "information"
      }])
    }
  }

  static createBadRequestResponse(issues: Array<fhir.OperationOutcomeIssue>): TranslatedSpineResponse {
    return {
      statusCode: 400,
      fhirResponse: fhir.createOperationOutcome(issues)
    }
  }

  static createServerErrorResponse(): TranslatedSpineResponse {
    return {
      statusCode: 500,
      fhirResponse: fhir.createOperationOutcome([{
        code: "invalid",
        severity: "error"
      }])
    }
  }

  private static handleErrorOrRejectionResponse(errorCodes: Array<hl7V3.Code<string>>, logger: pino.Logger) {
    const issues = errorCodes.map(SpineResponseHandler.toOperationOutcomeIssue)
    if (!issues.length) {
      logger.error("Trying to return bad request response with no error details")
      return SpineResponseHandler.createServerErrorResponse()
    }
    return SpineResponseHandler.createBadRequestResponse(issues)
  }

  private static toOperationOutcomeIssue(code: hl7V3.Code<string>): fhir.OperationOutcomeIssue {
    return {
      code: "invalid",
      severity: "error",
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
          code: code._attributes.code,
          display: code._attributes.displayName
        }]
      }
    }
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */

  protected handleRejectionResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<T>,
    logger: pino.Logger
  ): TranslatedSpineResponse {
    const errorCodes = this.extractRejectionCodes(sendMessagePayload)
    return SpineResponseHandler.handleErrorOrRejectionResponse(errorCodes, logger)
  }

  protected handleErrorResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<T>,
    logger: pino.Logger
  ): TranslatedSpineResponse {
    const errorCodes = this.extractErrorCodes(sendMessagePayload)
    return SpineResponseHandler.handleErrorOrRejectionResponse(errorCodes, logger)
  }

  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<T>,
    logger: pino.Logger
  ): TranslatedSpineResponse {
    return SpineResponseHandler.createSuccessResponse()
  }

  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export class CancelResponseHandler extends SpineResponseHandler<hl7V3.CancellationResponseRoot> {
  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): TranslatedSpineResponse {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return {
      statusCode: 200,
      fhirResponse: cancelResponseTranslator.translateSpineCancelResponseIntoBundle(cancellationResponse)
    }
  }

  protected handleErrorResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): TranslatedSpineResponse {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return {
      statusCode: 400,
      fhirResponse: cancelResponseTranslator.translateSpineCancelResponseIntoBundle(cancellationResponse)
    }
  }
}

export class ReleaseResponseHandler extends SpineResponseHandler<hl7V3.PrescriptionReleaseResponseRoot> {
  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseResponseRoot>
  ): TranslatedSpineResponse {
    const releaseResponse = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseResponse
    return {
      statusCode: 200,
      fhirResponse: releaseResponseTranslator.createOuterBundle(releaseResponse)
    }
  }
}
