import {readXmlStripNamespace} from "../../serialisation/xml"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"
import {translateSpineCancelResponseIntoBundle} from "./cancellation/cancellation-response"
import {createOuterBundle} from "./release/release-response"
import {toArray} from "../common"

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

  handleResponse(spineResponse: string): TranslatedSpineResponse {
    const sendMessagePayload = this.extractSendMessagePayload(spineResponse)
    if (!sendMessagePayload) {
      return null
    }
    const acknowledgementTypeCode = this.getAcknowledgementTypeCode(sendMessagePayload)
    if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED) {
      return this.handleSuccessResponse(sendMessagePayload)
    } else if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.ERROR) {
      return this.handleErrorResponse(sendMessagePayload)
    } else if (acknowledgementTypeCode === hl7V3.AcknowledgementTypeCode.REJECTED) {
      return this.handleRejectionResponse(sendMessagePayload)
    } else {
      console.error("Unhandled acknowledgement type code " + acknowledgementTypeCode)
      return SpineResponseHandler.createErrorResponse()
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

  private getAcknowledgementTypeCode(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    return sendMessagePayload.acknowledgement._attributes.typeCode
  }

  private handleRejectionResponse(sendMessagePayload: hl7V3.SendMessagePayload<T>): TranslatedSpineResponse {
    const operationOutcomeIssues = this.extractRejectionCodes(sendMessagePayload)
      .map(SpineResponseHandler.toOperationOutcomeIssue)
    return SpineResponseHandler.createErrorResponse(operationOutcomeIssues)
  }

  private extractRejectionCodes(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    const acknowledgementDetails = sendMessagePayload.acknowledgement.acknowledgementDetail ?? []
    return toArray(acknowledgementDetails).map(acknowledgementDetail => acknowledgementDetail.code)
  }

  private handleErrorResponse(sendMessagePayload: hl7V3.SendMessagePayload<T>): TranslatedSpineResponse {
    const specificResponse = this.handleErrorResponseImpl(sendMessagePayload)
    if (specificResponse) {
      return {
        statusCode: 400,
        fhirResponse: specificResponse
      }
    }
    const operationOutcomeIssues = this.extractErrorCodes(sendMessagePayload)
      .map(SpineResponseHandler.toOperationOutcomeIssue)
    return SpineResponseHandler.createErrorResponse(operationOutcomeIssues)
  }

  private extractErrorCodes(sendMessagePayload: hl7V3.SendMessagePayload<T>) {
    const reasons = sendMessagePayload.ControlActEvent.reason ?? []
    return toArray(reasons).map(reason => reason.justifyingDetectedIssueEvent.code)
  }

  private handleSuccessResponse(sendMessagePayload: hl7V3.SendMessagePayload<T>): TranslatedSpineResponse {
    const specificResponse = this.handleSuccessResponseImpl(sendMessagePayload)
    if (specificResponse) {
      return {
        statusCode: 200,
        fhirResponse: specificResponse
      }
    }
    return SpineResponseHandler.createSuccessResponse()
  }

  private static createSuccessResponse(): TranslatedSpineResponse {
    const issues: Array<fhir.OperationOutcomeIssue> = [{
      code: "informational",
      severity: "information"
    }]
    return {
      statusCode: 200,
      fhirResponse: SpineResponseHandler.createOperationOutcome(issues)
    }
  }

  static createErrorResponse(issues?: Array<fhir.OperationOutcomeIssue>): TranslatedSpineResponse {
    if (!issues?.length) {
      issues = [{
        code: "invalid",
        severity: "error"
      }]
    }
    return {
      statusCode: 400,
      fhirResponse: SpineResponseHandler.createOperationOutcome(issues)
    }
  }

  private static createOperationOutcome(issues: Array<fhir.OperationOutcomeIssue>) {
    return {
      resourceType: "OperationOutcome",
      issue: issues
    }
  }

  private static toOperationOutcomeIssue(code: hl7V3.Code<string>): fhir.OperationOutcomeIssue {
    return {
      code: "invalid",
      severity: "error",
      details: {
        coding: [{
          code: code._attributes.code,
          display: code._attributes.displayName
        }]
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected handleSuccessResponseImpl(sendMessagePayload: hl7V3.SendMessagePayload<T>): fhir.Resource {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected handleErrorResponseImpl(sendMessagePayload: hl7V3.SendMessagePayload<T>): fhir.Resource {
    return null
  }
}

export class CancelResponseHandler extends SpineResponseHandler<hl7V3.CancellationResponseRoot> {
  protected handleSuccessResponseImpl(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): fhir.Resource {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return translateSpineCancelResponseIntoBundle(cancellationResponse)
  }

  protected handleErrorResponseImpl(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.CancellationResponseRoot>
  ): fhir.Resource {
    const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
    return translateSpineCancelResponseIntoBundle(cancellationResponse)
  }
}

export class ReleaseResponseHandler extends SpineResponseHandler<hl7V3.PrescriptionReleaseResponseRoot> {
  protected handleSuccessResponseImpl(
    sendMessagePayload: hl7V3.SendMessagePayload<hl7V3.PrescriptionReleaseResponseRoot>
  ): fhir.Resource {
    const releaseResponse = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseResponse
    return createOuterBundle(releaseResponse)
  }
}
