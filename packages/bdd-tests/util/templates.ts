const fs = require('fs');

export function get_SignatureTemplate() {
  return fs.readFileSync( "./util/Signature.txt").toString();
}

export function get_ProvenanceTemplate() {
  return require( "../testData/provenance.json");
}

export function get_ReleaseTemplate() {
  return require( "../testData/eps_release.json");
}

export function get_DispenseTemplate() {
  return require( "../testData/eps_dispense.json");
}

export function get_medRequestTemplate() {
  return require( "../testData/medicationRequest.json");
}

export function get_medDispenseTemplate() {
  return require( "../testData/medicationDispense.json");
}
