import * as fhir from "../../models/fhir/fhir-resources"
import {CodeableConcept} from "../../models/fhir/fhir-resources"
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
  const {cancelStatusCode, fhirBundle} = getCancelStatusCodeAndErrorCodes(hl7BodyString)
  const successfulOperationOutcome: fhir.OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      code: "informational",
      severity: "information",
      diagnostics: hl7BodyString
    }]
  }
  if (cancelStatusCode <= 299) {
    return {
      body: successfulOperationOutcome,
      statusCode: cancelStatusCode
    }
  } else if (fhirBundle) {
    return {
      body: fhirBundle,
      statusCode: cancelStatusCode
    }
  }
  const {statusCode, errorCodes} = getStatusCodeAndErrorCodes(hl7BodyString)
  if (statusCode <= 299) {
    return {
      body: successfulOperationOutcome,
      statusCode
    }
  } else if (errorCodes) {
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

function getCancelStatusCodeAndErrorCodes(hl7Message: string): {
  cancelStatusCode: number,
  fhirBundle: fhir.Bundle
} {
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(hl7Message)
  if (cancelResponse) {
    const parsedMsg = readXml(cancelResponse[0]) as PORX50101
    const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
    const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
    return {
      cancelStatusCode: translateAcknowledgementTypeCodeToStatusCode(getCancelResponseTypeCode(parsedMsg)),
      fhirBundle: translateSpineCancelResponseIntoBundle(cancellationResponse)
    }
  }
  return {
    cancelStatusCode: 400,
    fhirBundle: undefined
  }
}

function getStatusCodeAndErrorCodes(hl7Message: string): {
  statusCode: number,
  errorCodes: Array<CodeableConcept>
} {
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (asyncMCCI) {
    const parsedMsg = readXml(asyncMCCI[0]) as AsyncMCCI
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getAsyncAcknowledgementTypeCode(parsedMsg)),
      errorCodes: translateAsyncSpineResponseErrorCodes(parsedMsg)
    }
  }

  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (syncMCCI) {
    const parsedMsg = readXml(syncMCCI[0]) as SyncMCCI
    return {
      statusCode: translateAcknowledgementTypeCodeToStatusCode(getSyncAcknowledgementTypeCode(parsedMsg)),
      errorCodes: translateSyncSpineResponseErrorCodes(parsedMsg)
    }
  }

  return {
    statusCode: 400,
    errorCodes: []
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
