import {fhir} from "@models"

const IDENTIFIER_MATCHERS = [
  {
    system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
    matcher: /^6\d{5}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/nmc-number",
    matcher: /^\d{2}[A-Z]\d4}[A-Z]$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/gmp-number",
    matcher: /^G[01234589]\d{6}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/gmc-number",
    matcher: /^C\d{7}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/hcpc-number",
    matcher: /^[A-Z]{2}\d{6}$/
  },
  {
    system: "https://fhir.hl7.org.uk/Id/din-number",
    matcher: /^[389]\d{5}$/
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
