import {createPractitionerOrRoleIdentifier} from "../../../../src/services/translation/response/identifiers"

describe("createPractitionerOrRoleIdentifier", () => {
  const cases = [
    ["G6123456", "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code"],
    ["12A3456B", "https://fhir.hl7.org.uk/Id/nmc-number"],
    ["G1234567", "https://fhir.hl7.org.uk/Id/gmp-number"],
    ["C1234567", "https://fhir.hl7.org.uk/Id/gmc-number"],
    ["1234567", "https://fhir.hl7.org.uk/Id/gphc-number"],
    ["AB123456", "https://fhir.hl7.org.uk/Id/hcpc-number"],
    ["123456", "https://fhir.hl7.org.uk/Id/din-number"],
    ["12345678", "https://fhir.hl7.org.uk/Id/professional-code"]
  ]
  test.each(cases)("identifies %s as %s", (input: string, system: string) => {
    const result = createPractitionerOrRoleIdentifier(input)
    expect(result.system).toEqual(system)
    expect(result.value).toEqual(input)
  })
})
