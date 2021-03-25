import {createPractitionerRole} from "../../../../src/services/translation/response/practitioner-role"
import * as TestResources from "../../../resources/test-resources"
import {getCancellationResponse} from "../common/test-helpers"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import {fhir} from "@models"

describe("createPractitionerRole", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const authorAgentPerson = cancellationErrorResponse.author.AgentPerson
  const performerParticipant = cancellationErrorDispensedResponse.performer.AgentPerson

  const practitionerId = "testReference"
  const healthcareServiceId = "anotherTestReference"

  const practitionerRole = createPractitionerRole(
    authorAgentPerson,
    practitionerId,
    healthcareServiceId
  )

  const performerParticipantPractitionerRole = createPractitionerRole(
    performerParticipant,
    practitionerId,
    healthcareServiceId
  )

  const cases = [
    [authorAgentPerson, practitionerRole],
    [performerParticipant, performerParticipantPractitionerRole]
  ]

  test.each(cases)(
    "returned PractitionerRole contains an identifier block with correct sds role profile id",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.identifier[0].system).toBe("https://fhir.nhs.uk/Id/sds-role-profile-id")
      expect(practitionerRole.identifier[0].value).toBe(agentPerson.id._attributes.extension)
    })

  test.each(cases)(
    "has reference to Practitioner",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.practitioner.reference).toBe(`urn:uuid:${practitionerId}`)
    }
  )

  test.each(cases)(
    "has reference to HealthcareService",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.healthcareService).toContainEqual({
        reference: `urn:uuid:${healthcareServiceId}`
      })
    }
  )

  test.each(cases)("has correct code", (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
    expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
    expect(practitionerRole.code[0].coding[0].system).toBe("https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName")
  })

  test("practitionerRole has correct telecom information", () => {
    expect(practitionerRole.telecom[0].system).toBe("phone")
    expect(practitionerRole.telecom[0].use).toBe("work")
    expect(practitionerRole.telecom[0].value).toBe("01234567890")
  })

  test("performerParticipantPractitionerRole has correct telecom information", () => {
    expect(performerParticipantPractitionerRole.telecom).toBeUndefined()
  })
})
