import * as fhir from "../../models/fhir/fhir-resources"
import {readXml} from "../serialisation/xml"
import {acknowledgementCodes, AsyncMCCI, PORX50101, SyncMCCI} from "../../models/hl7-v3/hl7-v3-spine-response"
import {SpineDirectResponse} from "../../models/spine"
import {translateSpineCancelResponseIntoBundle} from "./cancellation/cancellation-response"
import {toArray} from "./common"

const SYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<MCCI_IN010000UK13>)([\s\S]*)(?<=<\/MCCI_IN010000UK13>)/i
const ASYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<hl7:MCCI_IN010000UK13[\s\S]*>)([\s\S]*)(?<=<\/hl7:MCCI_IN010000UK13>)/i
// eslint-disable-next-line max-len
export const SPINE_CANCELLATION_ERROR_RESPONSE_REGEX = /(?=<hl7:PORX_IN050101UK31[\s\S]*>)([\s\S]*)(?<=<\/hl7:PORX_IN050101UK31>)/i

interface TranslatedSpineResponse {
  body: fhir.OperationOutcome | fhir.Bundle
  statusCode: number
}

export function translateToFhir<T>(message: SpineDirectResponse<T>): TranslatedSpineResponse {
  const hl7BodyString = message.body.toString()
  const {statusCode, fhirResponse} = getStatusCodeAndOperationOutcome(hl7BodyString)
  if (statusCode <= 299) {
    return {
      body: {
        resourceType: "OperationOutcome",
        issue: [{
          code: "informational",
          severity: "information",
          diagnostics: hl7BodyString
        }]
      },
      statusCode: statusCode
    }
  } else if (fhirResponse) {
    return {
      body: fhirResponse,
      statusCode: statusCode
    }
  }
}

function getStatusCodeAndOperationOutcome(hl7Message: string): {
  statusCode: number,
  fhirResponse: fhir.OperationOutcome | fhir.Bundle
} {
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(hl7Message)
  if (cancelResponse) {
    const parsedMsg = readXml(cancelResponse[0]) as PORX50101
    const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
    const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getCancelResponseTypeCode(parsedMsg)),
      fhirResponse: translateSpineCancelResponseIntoBundle(cancellationResponse)
    }
  }
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (asyncMCCI) {
    return getAsyncResponseAndErrorCodes(hl7Message, asyncMCCI)
  }

  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (syncMCCI) {
    return getSyncResponseAndErrorCodes(hl7Message, syncMCCI)
  }

  return {
    statusCode: 400,
    fhirResponse: {
      resourceType: "OperationOutcome",
      issue: [createErrorOperationOutcomeIssue(hl7Message)]
    }
  }
}

function getAsyncResponseAndErrorCodes(hl7Message: string, asyncMCCI: RegExpExecArray) {
  return getFhirResponseAndErrorCodes<AsyncMCCI>(
    hl7Message,
    readXml(asyncMCCI[0]) as AsyncMCCI,
    getAsyncAcknowledgementTypeCode,
    translateAsyncSpineResponseErrorCodes
  )
}

function getSyncResponseAndErrorCodes(hl7Message: string, syncMCCI: RegExpExecArray) {
  return getFhirResponseAndErrorCodes<SyncMCCI>(
    hl7Message,
    readXml(syncMCCI[0]) as SyncMCCI,
    getSyncAcknowledgementTypeCode,
    translateSyncSpineResponseErrorCodes
  )
}

function getFhirResponseAndErrorCodes<T extends AsyncMCCI | SyncMCCI>(
  hl7Message: string,
  MCCIWrapper: T,
  getStatusCodeFn: (async: T) => acknowledgementCodes,
  getErrorCodes: (async: T) => Array<fhir.CodeableConcept>
): {
  statusCode: number,
  fhirResponse: fhir.OperationOutcome
} {
  const errorCodes = getErrorCodes(MCCIWrapper)
  const operationOutcomeIssues = errorCodes.length
    ? errorCodes.map(errorCode => createErrorOperationOutcomeIssue(hl7Message, errorCode))
    : [createErrorOperationOutcomeIssue(hl7Message)]
  return {
    statusCode: translateAcknowledgementTypeCodeToStatusCode(getStatusCodeFn(MCCIWrapper)),
    fhirResponse: {
      resourceType: "OperationOutcome",
      issue: operationOutcomeIssues
    }
  }
}

function createErrorOperationOutcomeIssue(
  hl7Message: string,
  details?: fhir.CodeableConcept
): fhir.OperationOutcomeIssue {
  return {
    code: "invalid",
    severity: "error",
    diagnostics: hl7Message,
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
