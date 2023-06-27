import {createPractitionerRole} from "../../../../src/services/translation/response/practitioner-role"
import * as TestResources from "../../../resources/test-resources"
import {getCancellationResponse} from "../common/test-helpers"
import {hl7V3, fhir} from "@models"

describe("createPractitionerRole", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationNotFoundError)
  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const authorAgentPerson = cancellationErrorResponse.author.AgentPerson
  const performerParticipant = cancellationErrorDispensedResponse.performer.AgentPerson

  const practitionerId = "testReference"

  const practitionerRole = createPractitionerRole(authorAgentPerson, practitionerId)

  const practitionerJobRoleNameSystem = "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
  const practitionerJobRoleCodeSystem = "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode"

  const performerParticipantPractitionerRole = createPractitionerRole(performerParticipant, practitionerId)

  const cases = [
    [authorAgentPerson, practitionerRole, practitionerJobRoleNameSystem],
    [performerParticipant, performerParticipantPractitionerRole, practitionerJobRoleCodeSystem]
  ]

  test.each(cases)(
    "returned PractitionerRole contains an identifier block with correct sds role profile id",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.identifier[0].system).toBe("https://fhir.nhs.uk/Id/sds-role-profile-id")
      expect(practitionerRole.identifier[0].value).toBe(agentPerson.id._attributes.extension)
    }
  )

  test.each(cases)(
    "has reference to Practitioner",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.practitioner).toMatchObject({
        reference: `urn:uuid:${practitionerId}`
      })
    }
  )

  test.each(cases)(
    "has correct JobRole code",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole, practitionerJobRoleSystem: string) => {
      expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
      expect(practitionerRole.code[0].coding[0].system).toBe(practitionerJobRoleSystem)
    }
  )

  test("practitionerRole has correct telecom information", () => {
    expect(practitionerRole.telecom[0].system).toBe("phone")
    expect(practitionerRole.telecom[0].use).toBe("work")
    expect(practitionerRole.telecom[0].value).toBe("01234567890")
  })

  test("performerParticipantPractitionerRole has correct telecom information", () => {
    expect(performerParticipantPractitionerRole.telecom).toBeUndefined()
  })
})
