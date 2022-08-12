import {createPractitionerOrRoleIdentifier} from "../../../../src/services/translation/response/identifiers"
import {hl7V3} from "@models"

describe("createPractitionerOrRoleIdentifier", () => {
  test("1.54 gets mapped to professional code", () => {
    const testValue = "612345"
    const testAuthorId: hl7V3.PrescriptionAuthorId = {
      _attributes: {
        root: "1.2.826.0.1285.0.2.1.54",
        extension: testValue
      }
    }

    const result = createPractitionerOrRoleIdentifier(testAuthorId)
    expect(result.system).toEqual("https://fhir.hl7.org.uk/Id/professional-code")
    expect(result.value).toEqual(testValue)
  })

  const cases = [
    ["https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code", new hl7V3.SdsUniqueIdentifier("612345")],
    ["https://fhir.hl7.org.uk/Id/nmc-number", new hl7V3.SdsUniqueIdentifier("12A3456B")],
    ["https://fhir.hl7.org.uk/Id/gmp-number", new hl7V3.SdsUniqueIdentifier("G1234567")],
    ["https://fhir.hl7.org.uk/Id/gmc-number", new hl7V3.SdsUniqueIdentifier("C1234567")],
    ["https://fhir.hl7.org.uk/Id/gphc-number", new hl7V3.SdsUniqueIdentifier("1234567")],
    ["https://fhir.hl7.org.uk/Id/hcpc-number", new hl7V3.SdsUniqueIdentifier("AB123456")],
    ["https://fhir.hl7.org.uk/Id/din-number", new hl7V3.SdsUniqueIdentifier("123456")],
    ["https://fhir.hl7.org.uk/Id/professional-code", new hl7V3.SdsUniqueIdentifier("12345678")]
  ]
  test.each(cases)("identifies SdsUserId correctly as %s", (system: string, input: hl7V3.SdsUniqueIdentifier) => {
    const result = createPractitionerOrRoleIdentifier(input)
    expect(result.system).toEqual(system)
    expect(result.value).toEqual(input._attributes.extension)
  })
})
