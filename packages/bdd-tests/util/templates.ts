import fs from "fs"
import * as misc from "../testData/miscJSON"
import _epsPrepare from "../testData/epsPrepare.json"
import _provenance from "../testData/provenance.json"
import _epsRelease from "../testData/epsRelease.json"
import _epsDispense from "../testData/epsDispense.json"
import _epsReturn from "../testData/epsReturn.json"
import _epsWithdrawDispenseNotification from "../testData/epsWithdrawDispenseNotification.json"
import _medicationRequest from "../testData/medicationRequest.json"
import _communicationRequest from "../testData/communicationRequest.json"
import _medicationDispense from "../testData/medicationDispense.json"
import _medicationClaim from "../testData/medicationClaim.json"
import _epsClaim from "../testData/epsClaim.json"

export function getSignatureTemplate() {
  return fs.readFileSync("./util/signature.txt").toString()
}

export function getProvenanceTemplate() {
  return JSON.parse(JSON.stringify(_provenance))
}

export function getPrepareTemplate() {
  return JSON.parse(JSON.stringify(_epsPrepare))
}

export function getReleaseTemplate() {
  return JSON.parse(JSON.stringify(_epsRelease))
}

export function getDispenseTemplate() {
  return JSON.parse(JSON.stringify(_epsDispense))
}

export function getReturnTemplate() {
  return JSON.parse(JSON.stringify(_epsReturn))
}

export function getWithdrawDispenseNTemplate() {
  return JSON.parse(JSON.stringify(_epsWithdrawDispenseNotification))
}

export function getMedRequestTemplate() {
  return JSON.parse(JSON.stringify(_medicationRequest))
}

export function getCommunicationRequestTemplate() {
  return JSON.parse(JSON.stringify(_communicationRequest))
}

export function getMedDispenseTemplate() {
  return JSON.parse(JSON.stringify(_medicationDispense))
}

export function getMedClaimTemplate() {
  return JSON.parse(JSON.stringify(_medicationClaim))
}

export function getClaimTemplate() {
  return JSON.parse(JSON.stringify(_epsClaim))
}

export function statusReasonTemplate() {
  return JSON.parse(JSON.stringify(misc.statusReason))
}

export function extReplacementOfTemplate() {
  return JSON.parse(JSON.stringify(misc.extReplacementOf))
}

export function endorsementTemplate() {
  return JSON.parse(JSON.stringify(misc.endorsement))
}

export function medicationRepeatInfoTemplate() {
  return JSON.parse(JSON.stringify(misc.medicationRepeatInfo))
}

export function basedonTemplate() {
  return JSON.parse(JSON.stringify(misc.basedon))
}

export function statusReasonkey() {
  return misc.statusReasonkey
}
