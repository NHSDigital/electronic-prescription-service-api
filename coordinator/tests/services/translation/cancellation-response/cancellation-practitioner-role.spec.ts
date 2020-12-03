import {createPractitionerRole} from "../../../../src/services/translation/cancellation/cancellation-practitioner-role"
import * as TestResources from "../../../resources/test-resources"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/spine-response"
import {readXml} from "../../../../src/services/serialisation/xml"

describe("createPractitionerRole", () => {
  const actualError = TestResources.spineResponses.cancellationError
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const parsedMsg = readXml(cancelResponse)
  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
  const authorAgentPerson = cancellationResponse.author.AgentPerson

  const practitionerReference = "testReference"
  const organizationReference = "anotherTestReference"

  const practitionerRole = createPractitionerRole(
    authorAgentPerson,
    practitionerReference,
    organizationReference
  )

  test("returned PractitionerRole contains an identifier block with correct sds role profile id", () => {
    expect(practitionerRole.identifier[0].system).toBe("https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(practitionerRole.identifier[0].value).toBe(authorAgentPerson.id._attributes.extension)
  })

  test("has reference to Practitioner", () => {
    expect(practitionerRole.practitioner.reference).toBe(practitionerReference)
  })

  test("has reference to Organization", () => {
    expect(practitionerRole.organization.reference).toBe(organizationReference)
  })

  test("has correct code", () => {
    expect(practitionerRole.code[0].coding[0].code).toBe("R8000")
    expect(practitionerRole.code[0].coding[0].system).toBe("https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName")
  })

  test("has correct telecom information", () => {
    expect(practitionerRole.telecom[0].system).toBe("phone")
    expect(practitionerRole.telecom[0].use).toBe("work")
    expect(practitionerRole.telecom[0].value).toBe("01234567890")
  })
})
