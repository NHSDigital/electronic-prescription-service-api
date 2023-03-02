const fs = require('fs');

export function get_SignatureTemplate() {
  return fs.readFileSync( "./util/Signature.txt").toString();
}

export function get_ProvenanceTemplate() {
  return require( "../pacts/provenance.json");
}

export function get_ReleaseTemplate() {
  return require( "../pacts/eps_release.json");
}

export function get_DispenseTemplate() {
  return require( "../pacts/eps_dispense.json");
}

export function get_medRequestTemplate() {
  return require( "../pacts/medicationRequest.json");
}

export function get_medDispenseTemplate() {
  return require( "../pacts/medicationDispense.json");
}

