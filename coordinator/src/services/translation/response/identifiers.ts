import {fhir} from "@models"

const SPURIOUS_CODE_MATCHER = /^G[67][0-9]{6}$/
const NMC_CODE_MATCHER = /^[0-9]{2}[A-Z][0-9]{4}[A-Z]$/
const GMP_CODE_MATCHER = /^G[01234589][0-9]{6}$/
const GMC_CODE_MATCHER = /^C[0-9]{7}$/
const GPHC_CODE_MATCHER = /^[0-9]{7}$/
const HCPC_CODE_MATCHER = /^[A-Z]{2}[0-9]{6}$/
const DIN_CODE_MATCHER = /^[0-9]{6}$/

export function looksLikeSpuriousCode(userId: string): boolean {
  return SPURIOUS_CODE_MATCHER.test(userId)
}
export function looksLikeNmcCode(userId: string): boolean {
  return NMC_CODE_MATCHER.test(userId)
}
export function looksLikeGmpCode(userId: string): boolean {
  return GMP_CODE_MATCHER.test(userId)
}
export function looksLikeGmcCode(userId: string): boolean {
  return GMC_CODE_MATCHER.test(userId)
}
export function looksLikeGphcCode(userId: string): boolean {
  return GPHC_CODE_MATCHER.test(userId)
}
export function looksLikeHcpcCode(userId: string): boolean {
  return HCPC_CODE_MATCHER.test(userId)
}
export function looksLikeDinCode(userId: string): boolean {
  return DIN_CODE_MATCHER.test(userId)
}

export function createPractitionerOrRoleIdentifier(userId: string): fhir.Identifier {
  if (looksLikeSpuriousCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code", userId)
  }
  if (looksLikeNmcCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/nmc-number", userId)
  }
  if (looksLikeGmpCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/gmp-number", userId)
  }
  if (looksLikeGmcCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/gmc-number", userId)
  }
  if (looksLikeGphcCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/gphc-number", userId)
  }
  if (looksLikeHcpcCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/hcpc-number", userId)
  }
  if (looksLikeDinCode(userId)) {
    return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/din-number", userId)
  }
  return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/professional-code", userId)
}
