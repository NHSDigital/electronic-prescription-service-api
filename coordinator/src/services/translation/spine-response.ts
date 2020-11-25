import * as fhir from "../../models/fhir/fhir-resources"
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
  const {messageType, wrapper} = getMessageTypeAndWrapper(hl7BodyString)
  const acknowledgement = getAcknowledgement(messageType, wrapper)
  const statusCode = translateAcknowledgementToStatusCode(acknowledgement)

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
    const spineErrors = getSpineErrors(messageType, wrapper)
    const operationOutcomeIssues = spineErrors.length > 0
      ? spineErrors.map(
        spineError => (createErrorOperationOutcome(hl7BodyString, spineError))
      )
      : [createErrorOperationOutcome(hl7BodyString)]
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

function createErrorOperationOutcome(hl7Message: string, details?: fhir.CodeableConcept): fhir.OperationOutcomeIssue {
  return {
    code: "invalid",
    severity: "error",
    diagnostics: hl7Message,
    details: details
  }
}

type SpineResponseTypes = "sync" | "async" | "unknown"

function getMessageTypeAndWrapper(hl7Message: string): {
  messageType: SpineResponseTypes, wrapper: string
} {
  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (syncMCCI) {
    return {
      messageType: "sync",
      wrapper: syncMCCI[0]
    }
  } else if (asyncMCCI) {
    return {
      messageType: "async",
      wrapper: asyncMCCI[0]
    }
  }
  return {messageType: "unknown", wrapper: undefined}
}

function getAcknowledgement(responseType: SpineResponseTypes, wrapper: string): acknowledgementCodes {
  switch (responseType) {
  case "sync":
    return getSyncAcknowledgement(wrapper)
  case "async":
    return getAsyncAcknowledgement(wrapper)
  default:
    return "AR"
  }
}

function getSyncAcknowledgement(syncWrapper: string): acknowledgementCodes {
  const parsedMsg = readXml(syncWrapper) as SyncMCCI
  const acknowledgementElm = parsedMsg.MCCI_IN010000UK13.acknowledgement
  return acknowledgementElm._attributes.typeCode
}

function getAsyncAcknowledgement(asyncWrapper: string): acknowledgementCodes {
  const parsedMsg = readXml(asyncWrapper) as AsyncMCCI
  const acknowledgementElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:acknowledgement"]
  return acknowledgementElm._attributes.typeCode
}

function translateAcknowledgementToStatusCode(acknowledgement: acknowledgementCodes): number {
  switch(acknowledgement) {
  case "AA":
    return 200
  case "AE":
  case "AR":
    return 400
  }
}

export function getSpineErrors(responseType: SpineResponseTypes, wrapper: string): Array<fhir.CodeableConcept> {
  switch (responseType) {
  case "sync":
    return translateSyncSpineResponse(wrapper)
  case "async":
    return translateAsyncSpineResponse(wrapper)
  default:
    return []
  }
}

function translateSyncSpineResponse(syncWrapper: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(syncWrapper) as SyncMCCI
  const acknowledgementDetailElm = parsedMsg.MCCI_IN010000UK13.acknowledgement.acknowledgementDetail
  const acknowledgementDetailArray = toArray(acknowledgementDetailElm)
  return acknowledgementDetailArray.map(acknowledgementDetail => {
    return {
      coding: [{
        code: acknowledgementDetail.code._attributes.code,
        display: acknowledgementDetail.code._attributes.displayName,
        system: ""
      }]
    }
  })
}

function translateAsyncSpineResponse(asyncWrapper: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(asyncWrapper) as AsyncMCCI
  const reasonElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:ControlActEvent"]["hl7:reason"]
  const reasonArray = toArray(reasonElm)
  return reasonArray.map(reason => ({
    coding: [{
      code: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.code,
      display: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.displayName,
      system: ""
    }]
  }))
}
