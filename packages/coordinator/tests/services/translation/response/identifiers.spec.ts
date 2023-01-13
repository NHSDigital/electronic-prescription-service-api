import {createPractitionerOrRoleIdentifier} from "../../../../src/services/translation/response/identifiers"

describe("createPractitionerOrRoleIdentifier", () => {
  const cases = [
    ["612345", "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code"],
    ["12A3456B", "https://fhir.hl7.org.uk/Id/nmc-number"],
    ["G1234567", "https://fhir.hl7.org.uk/Id/gmp-number"],
    ["C1234567", "https://fhir.hl7.org.uk/Id/gmc-number"],
    ["AB123456", "https://fhir.hl7.org.uk/Id/hcpc-number"]
  ]

  test.each(cases)("identifies %s as %s", (input: string, system: string) => {
    const result = createPractitionerOrRoleIdentifier(input)
    expect(result.system).toEqual(system)
    expect(result.value).toEqual(input)
  })

  const professionalCases = ["12345678", "1234567"]

  test.each(professionalCases)("various Id values get mapped to professional-code", (input: string) => {
    const result = createPractitionerOrRoleIdentifier(input)
    expect(result.system).toEqual("https://fhir.hl7.org.uk/Id/professional-code")
    expect(result.value).toEqual(input)
  })

  const dinCases = ["312345", "812345", "912345"]

  test.each(dinCases)("various Id values get mapped to din-number", (input: string) => {
    const result = createPractitionerOrRoleIdentifier(input)
    expect(result.system).toEqual("https://fhir.hl7.org.uk/Id/din-number")
    expect(result.value).toEqual(input)
  })
})
