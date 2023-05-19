import fs from "fs"

export function getSignatureTemplate() {
  return fs.readFileSync( "./util/signature.txt").toString()
}

export function getProvenanceTemplate() {
  return require( "../testData/provenance.json")
}

export function getPrepareTemplate(){
  return require("../testData/epsPrepare.json")
}

export function getReleaseTemplate() {
  return require( "../testData/epsRelease.json")
}

export function getDispenseTemplate() {
  return require( "../testData/epsDispense.json")
}

export function getReturnTemplate() {
  return require( "../testData/epsReturn.json")
}

export function getWithdrawDispenseNTemplate() {
  return require( "../testData/epsWithdrawDispenseNotification.json")
}

export function getMedRequestTemplate() {
  return require( "../testData/medicationRequest.json")
}

export function getCommunicationRequestTemplate() {
  return require( "../testData/communicationRequest.json")
}

export function getMedDispenseTemplate() {
  return require( "../testData/medicationDispense.json")
}

export function getMedClaimTemplate() {
  return require( "../testData/medicationClaim.json")
}

export function getClaimTemplate() {
  return require( "../testData/epsClaim.json")
}
