import {readXmlStripNamespace} from "../../serialisation/xml"
import {fhir, hl7V3} from "@models"
import {toArray} from "../common"
import * as pino from "pino"
import * as cancelResponseTranslator from "./cancellation/cancellation-response"
import * as releaseResponseTranslator from "./release/release-response"

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
    switch (acknowledgementTypeCode) {
      case hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED:
        return this.handleSuccessResponse(sendMessagePayload, logger)
      case hl7V3.AcknowledgementTypeCode.ERROR:
      case hl7V3.AcknowledgementTypeCode.ERROR_ALTERNATIVE:
        return this.handleErrorResponse(sendMessagePayload, logger)
      case hl7V3.AcknowledgementTypeCode.REJECTED:
        return this.handleRejectionResponse(sendMessagePayload, logger)
      default:
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

  protected extractErrorCodes(sendMessagePayload: hl7V3.SendMessagePayload<T>): Array<hl7V3.Code<string>> {
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
    const epsCodeInformation = SpineResponseHandler.getErrorCodeInformation(code)
    return {
      code: epsCodeInformation.code,
      severity: "error",
      details: {
        coding: [{
          system: epsCodeInformation.system,
          code: epsCodeInformation.issueCode,
          display: epsCodeInformation.display
        }]
      }
    }
  }

  private static getErrorCodeInformation(code: hl7V3.Code<string>) {
    switch (code._attributes.codeSystem) {
      case hl7V3.ApplicationErrorMessageTypeCodes.PRESCRIBE:
        return SpineResponseHandler.toEpsPrescribeErrorCode(code)
      case hl7V3.ApplicationErrorMessageTypeCodes.DISPENSE:
        return SpineResponseHandler.toEpsDispenseErrorCode(code)
      default:
        return SpineResponseHandler.toUnhandledMessageTypeErrorCode(code)
    }
  }

  private static toUnhandledMessageTypeErrorCode(code: hl7V3.Code<string>): EpsErrorCodeInformation {
    return {
      code: fhir.IssueCodes.INVALID,
      issueCode: code._attributes.code,
      display: code._attributes.displayName,
      system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
    }
  }

  private static toEpsPrescribeErrorCode(code: hl7V3.Code<string>): EpsErrorCodeInformation {
    switch (code._attributes.code) {
      //TODO - remove?
      case "0001":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Patient is recorded as dead",
          issueCode: "PATIENT_DECEASED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0002":
        return {
          code: fhir.IssueCodes.DUPLICATE,
          display: "Duplicate prescription ID exists",
          issueCode: "DUPLICATE_PRESCRIPTION_ID",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0003":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Digital signature not found",
          issueCode: "MISSING_DIGITAL_SIGNATURE",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0005":
        return {
          code: fhir.IssueCodes.NOT_FOUND,
          display: "Prescription can not be found. Contact prescriber",
          issueCode: "PRESCRIPTION_NOT_FOUND",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "0007":
        return {
          code: fhir.IssueCodes.CODE_INVALID,
          display: "The resource ID was not valid." +
            " For example a NHS Number is presented which is not a valid NHS Number.",
          issueCode: "INVALID_RESOURCE_ID",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      //TODO - remove?
      case "0008":
        return {
          code: fhir.IssueCodes.VALUE,
          display: code._attributes.displayName,
          issueCode: "MISSING_VALUE",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      case "0009":
      case "7002":
        return {
          code: fhir.IssueCodes.STRUCTURE,
          display: "Invalid Message",
          issueCode: "INVALID_MESSAGE",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "0010":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Number of items on a prescription should be between 1 and 4",
          issueCode: "INVALID_NUMBER_MEDICATIONREQUESTS",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0012":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Invalid State Transition for Prescription",
          issueCode: "PRESCRIPTION_INVALID_STATE_TRANSITION",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0013":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Invalid State Transition for Prescription Item",
          issueCode: "MEDICATIONREQUEST_INVALID_STATE_TRANSITION",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0014":
        return {
          code: fhir.IssueCodes.NOT_FOUND,
          display: "Prescription Item Not found",
          issueCode: "MEDICATIONREQUEST_NOT_FOUND",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0015":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Invalid Claim. Prescription is not Dispensed",
          issueCode: "CLAIM_INVALID_NOT_DISPENSED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0018":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Mismatch in authorised repeat counts",
          issueCode: "MISMATCH_AUTHORISED_REPEAT_COUNT",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "0019":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Repeat count should be between 1 and 99",
          issueCode: "INVALID_REPEAT_COUNT",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0021":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Dispense Amendment/Cancellation Request does not pertain to Last Dispense",
          issueCode: "DISPENSE_AMEND_IDENTIFIER_MISMATCH",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "0099":
        return {
          code: fhir.IssueCodes.CONFLICT,
          display: "Resource version mismatch",
          issueCode: "RESOURCE_VERSION_MISMATCH",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      case "0100":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Claim amendment is not permitted outside of the claim period",
          issueCode: "CLAIM_AMEND_PERIOD_ISSUE",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      //TODO - remove?
      case "5008":
        return {
          code: fhir.IssueCodes.DUPLICATE,
          display: "Duplicate item ID exists",
          issueCode: "DUPLICATE_MEDICATIONREQUEST_ID",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "5009":
        return {
          code: fhir.IssueCodes.VALUE,
          display: "Error in check digit",
          issueCode: "INVALID_CHECK_DIGIT",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "9006":
        return {
          code: fhir.IssueCodes.VALUE,
          display: "Format of date passed is invalid",
          issueCode: "INVALID_DATE_FORMAT",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "9999":
        return {
          code: fhir.IssueCodes.PROCESSING,
          display: code._attributes.displayName,
          issueCode: "FAILURE_TO_PROCESS_MESSAGE",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      default:
        return {
          code: fhir.IssueCodes.INVALID,
          display: code._attributes.displayName,
          issueCode: "ERROR",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
    }
  }

  private static toEpsDispenseErrorCode(code: hl7V3.Code<string>): EpsErrorCodeInformation {
    switch (code._attributes.code) {
      case "0001":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Prescription has been cancelled",
          issueCode: "PRESCRIPTION_CANCELLED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0002":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Prescription has expired",
          issueCode: "PRESCRIPTION_EXPIRED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0003":
        return {
          code: fhir.IssueCodes.NOT_FOUND,
          display: "Resource not found",
          issueCode: "RESOURCE_NOT_FOUND",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      case "0004":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Prescription is with another dispenser",
          issueCode: "PRESCRIPTION_WITH_ANOTHER_DISPENSER",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0005":
        return {
          code: fhir.IssueCodes.BUSINESS_RULE,
          display: "Prescription has been dispensed",
          issueCode: "PRESCRIPTION_DISPENSED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0006":
        return {
          code: fhir.IssueCodes.INFORMATIONAL,
          display: "No more prescriptions available",
          issueCode: "NO_MORE_PRESCRIPTIONS",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      case "0007":
        return {
          code: fhir.IssueCodes.EXCEPTION,
          display: "Functionality disabled in spine",
          issueCode: "SERVICE_DISABLED",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "0099":
        return {
          code: fhir.IssueCodes.CONFLICT,
          display: "Resource version mismatch",
          issueCode: "RESOURCE_VERSION_MISMATCH",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      case "5000":
        return {
          code: fhir.IssueCodes.PROCESSING,
          display: code._attributes.displayName,
          issueCode: "FAILURE_TO_PROCESS_MESSAGE",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
      //TODO - remove?
      case "5888":
        return {
          code: fhir.IssueCodes.INVALID,
          display: "Invalid message",
          issueCode: "INVALID_MESSAGE",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      //TODO - remove?
      case "9006":
        return {
          code: fhir.IssueCodes.VALUE,
          display: "Format of date passed is invalid",
          issueCode: "INVALID_DATE_FORMAT",
          system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
        }
      default:
        return {
          code: fhir.IssueCodes.INVALID,
          display: code._attributes.displayName,
          issueCode: "ERROR",
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
        }
    }
  }

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

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<T>,
    logger: pino.Logger
  ): TranslatedSpineResponse {
    return SpineResponseHandler.createSuccessResponse()
  }
}

export class CancelResponseHandler extends SpineResponseHandler<hl7V3.CancellationResponseRoot> {
  translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle

  constructor(
    interactionId: string,
    translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle
    = cancelResponseTranslator.translateSpineCancelResponseIntoBundle
  ) {
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

export class ReleaseRejectionHandler extends SpineResponseHandler<hl7V3.PrescriptionReleaseRejectRoot> {
  protected extractErrorCodes(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseRejectRoot>
  ): Array<hl7V3.Code<string>> {
    const errorCode = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseReject
      .pertinentInformation?.pertinentRejectionReason?.value
    return errorCode ? [errorCode] : []
  }
}

export class ReleaseResponseHandler extends SpineResponseHandler<hl7V3.PrescriptionReleaseResponseRoot> {
  translator: (releaseResponse: hl7V3.PrescriptionReleaseResponse) => fhir.Bundle

  constructor(
    interactionId: string,
    translator: (releaseResponse: hl7V3.PrescriptionReleaseResponse) => fhir.Bundle
    = releaseResponseTranslator.createOuterBundle
  ) {
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

interface EpsErrorCodeInformation {
  code: fhir.IssueCodes
  display: string
  issueCode: string
  system: string
}
