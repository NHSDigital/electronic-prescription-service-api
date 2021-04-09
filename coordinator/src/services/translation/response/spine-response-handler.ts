import {readXmlStripNamespace} from "../../serialisation/xml"
import {fhir, hl7V3} from "@models"
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
        code: fhir.IssueCodes.INFORMATIONAL,
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
        code: fhir.IssueCodes.INVALID,
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
    const epsCodeInformation = SpineResponseHandler.toEpsErrorCode(code)
    return {
      code: epsCodeInformation.code,
      severity: "error",
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
          code: epsCodeInformation.issueCode,
          display: epsCodeInformation.display
        }]
      }
    }
  }

  private static toEpsErrorCode(code: hl7V3.Code<string>): EpsErrorCodeInformation{
    switch(code._attributes.code){
      case "0001":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.BUSINESS_RULE,
          "Patient is recorded as dead",
          "PATIENT_DECEASED"
        )
      case "0002":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.DUPLICATE,
          "Duplicate prescription ID exists",
          "DUPLICATE_PRESCRIPTION_ID"
        )
      case "0003":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.BUSINESS_RULE,
          "Digital signature not found",
          "MISSING_DIGITAL_SIGNATURE"
        )
      case "0009":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.STRUCTURE,
          "Invalid Message",
          "INVALID_MESSAGE"
        )
      case "0010":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.BUSINESS_RULE,
          "Number of items on a prescription should be between 1 and 4",
          "INVALID_NUMBER_MEDICATIONREQUESTS"
        )
      case "0018":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.BUSINESS_RULE,
          "Mismatch in authorised repeat counts",
          "MISMATCH_AUTHORISED_REPEAT_COUNT"
        )
      case "0019":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.BUSINESS_RULE,
          "Repeat count should be between 1 and 99",
          "INVALID_REPEAT_COUNT"
        )
      case "5008":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.DUPLICATE,
          "Duplicate item ID exists",
          "DUPLICATE_MEDICATIONREQUEST_ID"
        )
      case "5009":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.VALUE,
          "Error in check digit",
          "INVALID_CHECK_DIGIT"
        )
      case "9006":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.VALUE,
          "Format of date passed is invalid",
          "INVALID_DATE_FORMAT"
        )
      case "0007":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.CODE_INVALID,
          "The resource ID was not valid. For example a NHS Number is presented which is not a valid NHS Number.",
          "INVALID_RESOURCE_ID"
        )
      case "0008":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.VALUE,
          code._attributes.displayName,
          "MISSING_VALUE"
        )
      case "0099":
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.CONFLICT,
          "Resource version mismatch",
          "RESOURCE_VERSION_MISMATCH"
        )
      default:
        return new EpsErrorCodeInformation(
          fhir.IssueCodes.INVALID,
          code._attributes.displayName,
          "ERROR"
        )
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
  translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle

  constructor(interactionId: string, translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle) {
    super(interactionId)
    this.translator = translator
  }

  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): TranslatedSpineResponse {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return {
      statusCode: 200,
      fhirResponse: this.translator(cancellationResponse)
    }
  }

  protected handleErrorResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): TranslatedSpineResponse {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return {
      statusCode: 400,
      fhirResponse: this.translator(cancellationResponse)
    }
  }
}

export class ReleaseResponseHandler extends SpineResponseHandler<hl7V3.PrescriptionReleaseResponseRoot> {
  translator: (releaseResponse: hl7V3.PrescriptionReleaseResponse) => fhir.Bundle

  constructor(interactionId: string, translator: (releaseResponse: hl7V3.PrescriptionReleaseResponse) => fhir.Bundle) {
    super(interactionId)
    this.translator = translator
  }

  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseResponseRoot>
  ): TranslatedSpineResponse {
    const releaseResponse = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseResponse
    return {
      statusCode: 200,
      fhirResponse: this.translator(releaseResponse)
    }
  }
}

class EpsErrorCodeInformation {
  code: fhir.IssueCodes
  display: string
  issueCode: string

  constructor(
    code: fhir.IssueCodes,
    display: string,
    otherCode: string
  ) {
    this.code = code
    this.display = display
    this.issueCode = otherCode
  }
}
