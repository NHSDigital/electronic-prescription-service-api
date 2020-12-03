import * as fhir from "../../models/fhir/fhir-resources"
import {CodeableConcept} from "../../models/fhir/fhir-resources"
import {readXml} from "../serialisation/xml"
import {
  acknowledgementCodes,
  AsyncMCCI, PORX50101,
  SyncMCCI
} from "../../models/hl7-v3/hl7-v3-spine-response"
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

function isCancellationErrorResponse(message:string) {
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(message)
  if (cancelResponse) {
    const parsedMsg = readXml(cancelResponse[0]) as PORX50101
    const parsedMsgAcknowledgement = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:acknowledgement"]
    const ackCode = parsedMsgAcknowledgement._attributes.typeCode
    const statusCode = translateAcknowledgementTypeCodeToStatusCode(ackCode)
    if(statusCode == 400) {
      return parsedMsg
    }
  }
  return undefined
}

export function translateToFhir<T>(message: SpineDirectResponse<T>): TranslatedSpineResponse {
  const hl7BodyString = message.body.toString()
  const {statusCode, errorCodes} = getStatusCodeAndErrorCodes(hl7BodyString)
  const cancellationErrorResponse = isCancellationErrorResponse(hl7BodyString)
  if (cancellationErrorResponse) {
    const actEvent = cancellationErrorResponse["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
    const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
    return {
      body: translateSpineCancelResponseIntoBundle(cancellationResponse),
      statusCode: 400
    }
  } else if (statusCode <= 299) {
    const successfulOperationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [{
        code: "informational",
        severity: "information",
        diagnostics: hl7BodyString
      }]
    }
    return {
      body: successfulOperationOutcome,
      statusCode
    }
  } else {
    const operationOutcomeIssues = errorCodes.length
      ? errorCodes.map(errorCode => createErrorOperationOutcomeIssue(hl7BodyString, errorCode))
      : [createErrorOperationOutcomeIssue(hl7BodyString)]
    const errorOperationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: operationOutcomeIssues
    }
    return {
      body: errorOperationOutcome,
      statusCode
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

function getStatusCodeAndErrorCodes(hl7Message: string): {
  statusCode: number,
  errorCodes: Array<CodeableConcept>
} {
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (asyncMCCI) {
    const messageBody = asyncMCCI[0]
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getAsyncAcknowledgementTypeCode(messageBody)),
      errorCodes: translateAsyncSpineResponseErrorCodes(messageBody)
    }
  }

  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (syncMCCI) {
    const messageBody = syncMCCI[0]
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getSyncAcknowledgementTypeCode(messageBody)),
      errorCodes: translateSyncSpineResponseErrorCodes(messageBody)
    }
  }

  return {
    statusCode: 400,
    errorCodes: []
  }
}

function getSyncAcknowledgementTypeCode(syncWrapper: string): acknowledgementCodes {
  const parsedMsg = readXml(syncWrapper) as SyncMCCI
  const acknowledgementElm = parsedMsg.MCCI_IN010000UK13.acknowledgement
  return acknowledgementElm._attributes.typeCode
}

function getAsyncAcknowledgementTypeCode(asyncWrapper: string): acknowledgementCodes {
  const parsedMsg = readXml(asyncWrapper) as AsyncMCCI
  const acknowledgementElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:acknowledgement"]
  return acknowledgementElm._attributes.typeCode
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

function translateSyncSpineResponseErrorCodes(syncWrapper: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(syncWrapper) as SyncMCCI
  const acknowledgementDetailElm = parsedMsg.MCCI_IN010000UK13.acknowledgement.acknowledgementDetail
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

function translateAsyncSpineResponseErrorCodes(asyncWrapper: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(asyncWrapper) as AsyncMCCI
  const reasonElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:ControlActEvent"]["hl7:reason"]
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
