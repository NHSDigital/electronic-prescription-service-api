import {fhir} from "@models"

const IDENTIFIER_MATCHERS = [
  {
    system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    matcher: /^G[67][0-9]{6}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    matcher: /^[0-9]{2}[A-Z][0-9]{4}[A-Z]$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/gmp-number",
    matcher: /^G[01234589][0-9]{6}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/gmc-number",
    matcher: /^C[0-9]{7}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/gphc-number",
    matcher: /^[0-9]{7}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/hcpc-number",
    matcher: /^[A-Z]{2}[0-9]{6}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/din-number",
    matcher: /^[0-9]{6}$/
  }
]

export function createPractitionerOrRoleIdentifier(userId: string): fhir.Identifier {
  for (const {system, matcher} of IDENTIFIER_MATCHERS) {
    if (matcher.test(userId)) {
      return fhir.createIdentifier(system, userId)
    }
  }
  return fhir.createIdentifier("https://fhir.hl7.org.uk/Id/professional-code", userId)
}
