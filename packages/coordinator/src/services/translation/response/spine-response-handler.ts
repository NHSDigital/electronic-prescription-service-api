import {readXmlStripNamespace} from "../../serialisation/xml"
import {fhir, hl7V3} from "@models"
import {toArray} from "../common"
import * as pino from "pino"
import * as cancelResponseTranslator from "./cancellation/cancellation-response"
import * as releaseResponseTranslator from "./release/release-response"
import {getStatusCode} from "../../../utils/status-code"
import {convertTelecom, generateResourceId} from "./common"
import {createOrganization} from "./organization"
import {TranslationResponseResult} from "./release/release-response"
import {DispenseProposalReturnFactory, ReturnFactory} from "../request/return/return-factory"
import {SpineReturnHandler} from "./spine-return-handler"

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

  async handleResponse(spineResponse: string, logger: pino.Logger): Promise<TranslatedSpineResponse> {
    const sendMessagePayload = this.extractSendMessagePayload(spineResponse)
    if (!sendMessagePayload) {
      return null
    }
    const acknowledgementTypeCode = this.extractAcknowledgementTypeCode(sendMessagePayload)
    switch (acknowledgementTypeCode) {
      case hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED:
        return await this.handleSuccessResponse(sendMessagePayload, logger)
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

  static createServerErrorResponse(): TranslatedSpineResponse {
    return {
      statusCode: 500,
      fhirResponse: fhir.createOperationOutcome([{
        code: fhir.IssueCodes.INVALID,
        severity: "error"
      }])
    }
  }

  static createResponseForIssues(issues: Array<fhir.OperationOutcomeIssue>): TranslatedSpineResponse {
    return {
      statusCode: getStatusCode(issues),
      fhirResponse: fhir.createOperationOutcome(issues)
    }
  }

  private static handleErrorOrRejectionResponse(errorCodes: Array<hl7V3.Code<string>>, logger: pino.Logger) {
    const issues = errorCodes.map(SpineResponseHandler.getErrorCodeInformation)
    if (!issues.length) {
      logger.error("Trying to return bad request response with no error details")
      return SpineResponseHandler.createServerErrorResponse()
    }
    logger.info({issues}, "Issues found in spine response. Returning non successful result")
    return SpineResponseHandler.createResponseForIssues(issues)
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

  private static toUnhandledMessageTypeErrorCode(code: hl7V3.Code<string>): fhir.OperationOutcomeIssue {
    return fhir.createOperationOutcomeIssue(
      fhir.IssueCodes.INVALID,
      "error",
      fhir.createCodeableConcept(
        "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        code._attributes.code,
        code._attributes.displayName
      ))
  }

  private static toEpsPrescribeErrorCode(code: hl7V3.Code<string>): fhir.OperationOutcomeIssue {
    switch (code._attributes.code) {
      //TODO - remove?
      case "0001":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PATIENT_DECEASED",
            "Patient is recorded as dead"
          ))
      case "0002":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.DUPLICATE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "DUPLICATE_PRESCRIPTION_ID",
            "Duplicate prescription ID exists"
          ))
      case "0003":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "MISSING_DIGITAL_SIGNATURE",
            "Digital signature not found"
          ))
      case "0005":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.NOT_FOUND,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_NOT_FOUND",
            "Prescription can not be found. Contact prescriber"
          ))
      //TODO - remove?
      case "0007":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.CODE_INVALID,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "INVALID_RESOURCE_ID",
            "The resource ID was not valid." +
            " For example a NHS Number is presented which is not a valid NHS Number."
          ))
      //TODO - remove?
      case "0008":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.VALUE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "MISSING_VALUE",
            code._attributes.displayName
          ))
      case "0009":
      case "7002":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.STRUCTURE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_MESSAGE",
            "Invalid Message"
          ))
      //TODO - remove?
      case "0010":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_NUMBER_MEDICATIONREQUESTS",
            "Number of items on a prescription should be between 1 and 4"
          ))
      case "0012":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_INVALID_STATE_TRANSITION",
            "Invalid State Transition for Prescription"
          ))
      case "0013":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "MEDICATIONREQUEST_INVALID_STATE_TRANSITION",
            "Invalid State Transition for Prescription Item"
          ))
      case "0014":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.NOT_FOUND,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "MEDICATIONREQUEST_NOT_FOUND",
            "Prescription Item Not found"
          ))
      case "0015":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "CLAIM_INVALID_NOT_DISPENSED",
            "Invalid Claim. Prescription is not Dispensed"
          ))
      case "0018":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "MISMATCH_AUTHORISED_REPEAT_COUNT",
            "Mismatch in authorised repeat counts"
          ))
      //TODO - remove?
      case "0019":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_REPEAT_COUNT",
            "Repeat count should be between 1 and 99"
          ))
      case "0021":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "DISPENSE_AMEND_IDENTIFIER_MISMATCH",
            "Dispense Amendment/Cancellation Request does not pertain to Last Dispense"
          ))
      //TODO - remove?
      case "0099":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.CONFLICT,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "RESOURCE_VERSION_MISMATCH",
            "Resource version mismatch"
          ))
      case "0100":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "CLAIM_AMEND_PERIOD_ISSUE",
            "Claim amendment is not permitted outside of the claim period"
          ))
      //TODO - remove?
      case "5008":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.DUPLICATE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "DUPLICATE_MEDICATIONREQUEST_ID",
            "Duplicate item ID exists"
          ))
      //TODO - remove?
      case "5009":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.VALUE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_CHECK_DIGIT",
            "Error in check digit"
          ))
      //TODO - remove?
      case "9006":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.VALUE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_DATE_FORMAT",
            "Format of date passed is invalid"
          ))
      case "9999":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.PROCESSING,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "FAILURE_TO_PROCESS_MESSAGE",
            code._attributes.displayName
          ))
      default:
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.INVALID,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "ERROR",
            code._attributes.displayName
          ))
    }
  }

  private static toEpsDispenseErrorCode(code: hl7V3.Code<string>): fhir.OperationOutcomeIssue {
    switch (code._attributes.code) {
      case "0001":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_CANCELLED",
            "Prescription has been cancelled"
          ))
      case "0002":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_EXPIRED",
            "Prescription has expired"
          ))
      case "0003":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.NOT_FOUND,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "RESOURCE_NOT_FOUND",
            "Resource not found"
          ))
      case "0004":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_WITH_ANOTHER_DISPENSER",
            "Prescription is with another dispenser"
          ))
      case "0005":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.BUSINESS_RULE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "PRESCRIPTION_DISPENSED",
            "Prescription has been dispensed"
          ))
      case "0006":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.INFORMATIONAL,
          "information",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "NO_MORE_PRESCRIPTIONS",
            "No more prescriptions available"
          ))
      case "0007":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.EXCEPTION,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "SERVICE_DISABLED",
            "Functionality disabled in spine"
          ))
      //TODO - remove?
      case "0099":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.CONFLICT,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "RESOURCE_VERSION_MISMATCH",
            "Resource version mismatch"
          ))
      case "5000":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.PROCESSING,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "FAILURE_TO_PROCESS_MESSAGE",
            code._attributes.displayName
          ))
      //TODO - remove?
      case "5888":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.INVALID,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_MESSAGE",
            "Invalid message"
          ))
      //TODO - remove?
      case "9006":
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.VALUE,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
            "INVALID_DATE_FORMAT",
            "Format of date passed is invalid"
          ))
      default:
        return fhir.createOperationOutcomeIssue(
          fhir.IssueCodes.INVALID,
          "error",
          fhir.createCodeableConcept(
            "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            "ERROR",
            code._attributes.displayName
          ))
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
  protected async handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<T>,
    logger: pino.Logger
  ): Promise<TranslatedSpineResponse> {
    return SpineResponseHandler.createSuccessResponse()
  }
}

export class CancelResponseHandler extends SpineResponseHandler<hl7V3.CancellationResponseRoot> {
  translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle | fhir.OperationOutcome

  constructor(
    interactionId: string,
    translator: (cancelResponse: hl7V3.CancellationResponse) => fhir.Bundle | fhir.OperationOutcome
    = cancelResponseTranslator.translateSpineCancelResponse
  ) {
    super(interactionId)
    this.translator = translator
  }

  protected async handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): Promise<TranslatedSpineResponse> {
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

interface SpineResponseTranslator {
  translator: (
    releaseResponse: hl7V3.PrescriptionReleaseResponse,
    logger: pino.Logger,
    returnFactory: ReturnFactory
  ) => Promise<TranslationResponseResult>
}

export class ReleaseResponseHandler
  extends SpineResponseHandler<hl7V3.PrescriptionReleaseResponseRoot>
  implements SpineResponseTranslator {

  private readonly dispensePurposalReturnFactory: ReturnFactory
  private readonly releaseReturnHandler: SpineReturnHandler
  translator: (
    releaseResponse: hl7V3.PrescriptionReleaseResponse,
    logger: pino.Logger,
    returnFactory: ReturnFactory
  ) => Promise<TranslationResponseResult>

  constructor(
    interactionId: string,
    releaseReturnHandler: SpineReturnHandler,
    translator: (releaseResponse: hl7V3.PrescriptionReleaseResponse,
      logger: pino.Logger, returnFactory: ReturnFactory) => Promise<TranslationResponseResult>
    = releaseResponseTranslator.translateReleaseResponse,
    dispenseReturnFactory: ReturnFactory = new DispenseProposalReturnFactory()

  ) {
    super(interactionId)
    this.translator = translator
    this.dispensePurposalReturnFactory = dispenseReturnFactory
    this.releaseReturnHandler = releaseReturnHandler
  }

  protected async handleSuccessResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseResponseRoot>,
    logger: pino.Logger
  ): Promise<TranslatedSpineResponse> {
    const releaseResponse = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseResponse
    const translationResponseResult = await this.translator(
      releaseResponse,
      logger,
      this.dispensePurposalReturnFactory
    )

    // This will be removed once AEA-2950 has been completed
    // returning prescriptions on internal dev with mock signatures
    // will block other interactions from being tested
    if (process.env.ENVIRONMENT !== "internal-dev") {
      if (translationResponseResult.dispenseProposalReturns?.length > 0) {
        this.releaseReturnHandler.handle(logger, translationResponseResult.dispenseProposalReturns)
      }
    }
    return {
      statusCode: 200,
      fhirResponse: translationResponseResult.translatedResponse
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

  protected handleErrorResponse(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseRejectRoot>,
    logger: pino.Logger
  ): TranslatedSpineResponse {
    const spineResponse = super.handleErrorResponse(sendMessagePayload, logger)
    const operationOutcome = spineResponse.fhirResponse as fhir.OperationOutcome

    if (operationOutcome.issue.some(
      (issue) => ReleaseRejectionHandler.withAnotherDispenser(issue)
    )) {
      const organization = ReleaseRejectionHandler.getOrganizationInfo(sendMessagePayload)
      operationOutcome.contained = [organization]
      const extension: fhir.ReferenceExtension<fhir.Bundle> = {
        url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo",
        valueReference: {reference: `#${organization.id}`}
      }
      operationOutcome.extension = [extension]
    }
    return spineResponse
  }

  private static withAnotherDispenser(issue: fhir.OperationOutcomeIssue) {
    const issueDetails = issue.details.coding
    return issueDetails.some(issue => issue.code === "PRESCRIPTION_WITH_ANOTHER_DISPENSER")
  }

  private static getDiagnosticInfo(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseRejectRoot>
  ): string {
    const releaseRejection = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseReject
    const rejectionReason = releaseRejection.pertinentInformation.pertinentRejectionReason

    const performerAgentPerson = rejectionReason.performer.AgentPerson
    const v3Telecom = performerAgentPerson.telecom
    const firstFhirTelecom = convertTelecom(v3Telecom)[0]

    const v3Org = performerAgentPerson.representedOrganization
    const odsCode = v3Org.id._attributes.extension
    const orgName = v3Org.name._text

    const diagnosticObject = {odsCode, name: orgName, tel: firstFhirTelecom.value}
    return JSON.stringify(diagnosticObject)
  }

  private static getOrganizationInfo(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseRejectRoot>
  ): fhir.Organization {
    const releaseRejection = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseReject
    const rejectionReason = releaseRejection.pertinentInformation.pertinentRejectionReason
    const v3Org = rejectionReason.performer?.AgentPerson.representedOrganization
    if (v3Org) {
      return createOrganization(v3Org)
    } else {
      const organization: fhir.Organization = {
        id: generateResourceId(),
        resourceType: "Organization",
        name: "UNKNOWN",
        identifier: [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: "UNKNOWN"}]
      }
      return organization
    }
  }
}
