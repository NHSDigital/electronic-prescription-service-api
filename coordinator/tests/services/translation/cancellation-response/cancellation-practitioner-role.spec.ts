import {createPractitionerRole} from "../../../../src/services/translation/cancellation/cancellation-practitioner-role"
import * as fhir from "../../../../src/models/fhir/fhir-resources"

describe("createPractitionerRole", () => {

  const practitionerReference = "testReference"
  const practitionerCode = "R8000"
  const organizationReference = "anotherTestReference"
  const organizationTelecom = [] as Array<fhir.ContactPoint>

  const practitionerRole = createPractitionerRole(
    practitionerReference,
    practitionerCode,
    organizationReference,
    organizationTelecom
  )

  test("returned PractitionerRole contains an identifier block with correct sds role profile id", () => {
    expect(practitionerRole.identifier[0].system).toBe("https://fhir.nhs.uk/Id/sds-role-profile-id")
    // expect(practitionerRole.identifier[0].value).toBe("something")
  })

  test("has reference to Practitioner", () => {
    expect(practitionerRole.practitioner.reference).toBe(practitionerReference)
  })

  test("has reference to Organization", () => {
    expect(practitionerRole.organization.reference).toBe(organizationReference)
  })

  test("has correct code", () => {
    expect(practitionerRole.code[0].coding[0].code).toBe(practitionerCode)
    expect(practitionerRole.code[0].coding[0].system).toBe("https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName")
  })

  test("has correct telecom information", () => {
    expect(practitionerRole.telecom).toBe(organizationTelecom)
  })
})
