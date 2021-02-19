import * as fhir from "../../../models/fhir/fhir-resources"
import {readXml} from "../../serialisation/xml"
import {acknowledgementCodes, AsyncMCCI, PORX50101, SyncMCCI} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {SpineDirectResponse} from "../../../models/spine"
import {translateSpineCancelResponseIntoBundle} from "./cancellation/cancellation-response"
import {toArray} from "../common"

const SYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<MCCI_IN010000UK13>)([\s\S]*)(?<=<\/MCCI_IN010000UK13>)/i
const ASYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<hl7:MCCI_IN010000UK13[\s\S]*>)([\s\S]*)(?<=<\/hl7:MCCI_IN010000UK13>)/i
// eslint-disable-next-line max-len
export const SPINE_CANCELLATION_ERROR_RESPONSE_REGEX = /(?=<hl7:PORX_IN050101UK31[\s\S]*>)([\s\S]*)(?<=<\/hl7:PORX_IN050101UK31>)/i

interface TranslatedSpineResponse {
  fhirResponse: fhir.OperationOutcome | fhir.Bundle
  statusCode: number
}

export function translateToFhir<T>(hl7Message: SpineDirectResponse<T>): TranslatedSpineResponse {
  const bodyString = hl7Message.body.toString()
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(bodyString)
  if (cancelResponse) {
    const parsedMsg = readXml(cancelResponse[0]) as PORX50101
    const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
    const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getCancelResponseTypeCode(parsedMsg)),
      fhirResponse: translateSpineCancelResponseIntoBundle(cancellationResponse)
    }
  }
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(bodyString)
  if (asyncMCCI) {
    return getAsyncResponseAndErrorCodes(asyncMCCI)
  }

  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(bodyString)
  if (syncMCCI) {
    return getSyncResponseAndErrorCodes(syncMCCI)
  }

  return {
    statusCode: 400,
    fhirResponse: {
      resourceType: "OperationOutcome",
      issue: [createOperationOutcomeIssue(400)]
    }
  }
}

function getAsyncResponseAndErrorCodes(asyncMCCI: RegExpExecArray) {
  return getFhirResponseAndErrorCodes<AsyncMCCI>(
    readXml(asyncMCCI[0]) as AsyncMCCI,
    getAsyncAcknowledgementTypeCode,
    translateAsyncSpineResponseErrorCodes
  )
}

function getSyncResponseAndErrorCodes(syncMCCI: RegExpExecArray) {
  return getFhirResponseAndErrorCodes<SyncMCCI>(
    readXml(syncMCCI[0]) as SyncMCCI,
    getSyncAcknowledgementTypeCode,
    translateSyncSpineResponseErrorCodes
  )
}

function getFhirResponseAndErrorCodes<T extends AsyncMCCI | SyncMCCI>(
  MCCIWrapper: T,
  getStatusCodeFn: (wrapper: T) => acknowledgementCodes,
  getErrorCodes: (wrapper: T) => Array<fhir.CodeableConcept>
): TranslatedSpineResponse {
  const statusCode = translateAcknowledgementTypeCodeToStatusCode(getStatusCodeFn(MCCIWrapper))
  const errorCodes = getErrorCodes(MCCIWrapper)
  const operationOutcomeIssues = errorCodes.length
    ? errorCodes.map(errorCode => createOperationOutcomeIssue(statusCode, errorCode))
    : [createOperationOutcomeIssue(statusCode)]
  return {
    statusCode: statusCode,
    fhirResponse: {
      resourceType: "OperationOutcome",
      issue: operationOutcomeIssues
    }
  }
}

export function createOperationOutcomeIssue(
  statusCode: number,
  details?: fhir.CodeableConcept
): fhir.OperationOutcomeIssue {
  const successfulMessage = statusCode <= 299
  return {
    code: successfulMessage ? "informational" : "invalid",
    severity: successfulMessage ? "information" : "error",
    details: details
  }
}

function getSyncAcknowledgementTypeCode(syncWrapper: SyncMCCI): acknowledgementCodes {
  const acknowledgementElm = syncWrapper.MCCI_IN010000UK13.acknowledgement
  return acknowledgementElm._attributes.typeCode
}

function getAsyncAcknowledgementTypeCode(asyncWrapper: AsyncMCCI): acknowledgementCodes {
  const acknowledgementElm = asyncWrapper["hl7:MCCI_IN010000UK13"]["hl7:acknowledgement"]
  return acknowledgementElm._attributes.typeCode
}

function getCancelResponseTypeCode(parsedMsg: PORX50101) {
  const parsedMsgAcknowledgement = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:acknowledgement"]
  return parsedMsgAcknowledgement._attributes.typeCode
}

function translateAcknowledgementTypeCodeToStatusCode(acknowledgementTypeCode: acknowledgementCodes): number {
  switch (acknowledgementTypeCode) {
    case "AA":
      return 200
    case "AE":
    case "AR":
    default:
      return 400
  }
}

function translateSyncSpineResponseErrorCodes(syncWrapper: SyncMCCI): Array<fhir.CodeableConcept> {
  const acknowledgementDetailElm = syncWrapper.MCCI_IN010000UK13.acknowledgement.acknowledgementDetail
  if (!acknowledgementDetailElm) {
    return []
  }

  const acknowledgementDetailArray = toArray(acknowledgementDetailElm)
  return acknowledgementDetailArray.map(acknowledgementDetail => {
    return {
      coding: [{
        code: acknowledgementDetail.code._attributes.code,
        display: acknowledgementDetail.code._attributes.displayName
      }]
    }
  })
}

function translateAsyncSpineResponseErrorCodes(asyncWrapper: AsyncMCCI): Array<fhir.CodeableConcept> {
  const reasonElm = asyncWrapper["hl7:MCCI_IN010000UK13"]["hl7:ControlActEvent"]["hl7:reason"]
  if (!reasonElm) {
    return []
  }

  const reasonArray = toArray(reasonElm)
  return reasonArray.map(reason => ({
    coding: [{
      code: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.code,
      display: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.displayName
    }]
  }))
}
