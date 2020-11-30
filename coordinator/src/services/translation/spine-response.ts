import * as fhir from "../../models/fhir/fhir-resources"
import {CodeableConcept} from "../../models/fhir/fhir-resources"
import {readXml} from "../serialisation/xml"
import {acknowledgementCodes, AsyncMCCI, SyncMCCI} from "../../models/hl7-v3/hl7-v3-spine-response"
import {toArray} from "./common"
import {SpineDirectResponse} from "../../models/spine"

const SYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<MCCI_IN010000UK13>)([\s\S]*)(?<=<\/MCCI_IN010000UK13>)/i
const ASYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<hl7:MCCI_IN010000UK13[\s\S]*>)([\s\S]*)(?<=<\/hl7:MCCI_IN010000UK13>)/i

interface TranslatedSpineResponse {
  operationOutcome: fhir.OperationOutcome
  statusCode: number
}

export function translateToOperationOutcome<T>(message: SpineDirectResponse<T>): TranslatedSpineResponse {
  const hl7BodyString = message.body.toString()
  const {statusCode, errorCodes} = getStatusCodeAndErrorCodes(hl7BodyString)
  if (statusCode <= 299) {
    const successfulOperationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [{
        code: "informational",
        severity: "information",
        diagnostics: hl7BodyString
      }]
    }
    return {
      operationOutcome: successfulOperationOutcome,
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
      operationOutcome: errorOperationOutcome,
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
