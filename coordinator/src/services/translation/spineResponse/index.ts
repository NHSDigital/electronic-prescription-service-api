import * as fhir from "../../../models/fhir/fhir-resources"
import {readXml} from "../../serialisation/xml"
import {acknowledgementCodes, AsyncMCCI, SyncMCCI} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {toArray} from "../common"

const SYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<MCCI_IN010000UK13>)([\s\S]*)(?<=<\/MCCI_IN010000UK13>)/i
const ASYNC_SPINE_RESPONSE_MCCI_REGEX = /(?=<hl7:MCCI_IN010000UK13[\s\S]*>)([\s\S]*)(?<=<\/hl7:MCCI_IN010000UK13>)/i

export function getAcknowledgement(hl7Message: string): acknowledgementCodes {
  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7Message)
  if (syncMCCI) return getSyncAcknowledgement(syncMCCI[0])
  else if (asyncMCCI) return getAsyncAcknowledgement(asyncMCCI[0])
  else return "AR"
}

function getSyncAcknowledgement(hl7Message: string): acknowledgementCodes {
  const parsedMsg = readXml(hl7Message) as SyncMCCI
  const acknowledgementElm = parsedMsg.MCCI_IN010000UK13.acknowledgement
  return acknowledgementElm._attributes.typeCode
}

function getAsyncAcknowledgement(hl7Message: string): acknowledgementCodes {
  const parsedMsg = readXml(hl7Message) as AsyncMCCI
  const acknowledgementElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:acknowledgement"]
  return acknowledgementElm._attributes.typeCode
}

export function translateAcknowledgementToStatusCode(acknowledgement: acknowledgementCodes): number {
  switch(acknowledgement) {
  case "AA":
    return 200
  case "AE":
  case "AR":
    return 400
  }
}

export function getSpineErrors(hl7BodyString: string): Array<fhir.CodeableConcept> {
  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7BodyString)
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(hl7BodyString)
  if (syncMCCI) {
    return translateSyncSpineResponse(syncMCCI[0])
  } else if (asyncMCCI) {
    return translateAsyncSpineResponse(asyncMCCI[0])
  } else {
    return []
  }
}

function translateSyncSpineResponse(hl7Message: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(hl7Message) as SyncMCCI
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

function translateAsyncSpineResponse(hl7Message: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(hl7Message) as AsyncMCCI
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
