import {
  createPractitionerRole,
  createRefactoredPractitionerRole
} from "../../../../src/services/translation/response/practitioner-role"
import * as TestResources from "../../../resources/test-resources"
import {getCancellationResponse} from "../common/test-helpers"
import {hl7V3, fhir} from "@models"
import {isReference} from "../../../../src/utils/type-guards"

describe("createPractitionerRole", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationNotFoundError)
  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const authorAgentPerson = cancellationErrorResponse.author.AgentPerson
  const performerParticipant = cancellationErrorDispensedResponse.performer.AgentPerson

  const practitionerId = "testReference"

  const practitionerRole = createPractitionerRole(
    authorAgentPerson,
    practitionerId
  )

  const practitionerJobRoleNameSystem = "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
  const practitionerJobRoleCodeSystem = "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleCode"

  const performerParticipantPractitionerRole = createPractitionerRole(
    performerParticipant,
    practitionerId
  )

  const cases = [
    [authorAgentPerson, practitionerRole, practitionerJobRoleNameSystem],
    [performerParticipant, performerParticipantPractitionerRole, practitionerJobRoleCodeSystem]
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
      expect(practitionerRole.practitioner).toMatchObject({
        reference: `urn:uuid:${practitionerId}`
      })
    }
  )

  test.each(cases)("has correct (JobRoleName) code", (
    agentPerson: hl7V3.AgentPerson,
    practitionerRole: fhir.PractitionerRole,
    practitionerJobRoleNameSystem: string
  ) => {
    expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
    expect(practitionerRole.code[0].coding[0].system).toBe(practitionerJobRoleNameSystem)
  })

  test.each(cases)("has correct (JobRoleCode) code", (
    agentPerson: hl7V3.AgentPerson,
    practitionerRole: fhir.PractitionerRole,
    practitionerJobRoleCodeSystem: string
  ) => {
    expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
    expect(practitionerRole.code[0].coding[0].system).toBe(practitionerJobRoleCodeSystem)
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

describe("createRefactoredPractitionerRole", () => {
  const cancellationErrorResponse = getCancellationResponse(TestResources.spineResponses.cancellationNotFoundError)
  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )

  const authorAgentPerson = cancellationErrorResponse.author.AgentPerson
  const responsiblePartyAgentPerson = cancellationErrorResponse.responsibleParty.AgentPerson
  const performerAgentPerson = cancellationErrorDispensedResponse.performer.AgentPerson

  /* add healthcareProvider section to author to test Organization translations */
  const testOrg = new hl7V3.Organization()
  testOrg.id = new hl7V3.SdsOrganizationIdentifier("testId")
  testOrg.name = new hl7V3.Text("testName")
  authorAgentPerson.representedOrganization.healthCareProviderLicense = new hl7V3.HealthCareProviderLicense(testOrg)

  const authorPractitionerRole = createRefactoredPractitionerRole(authorAgentPerson)
  const responsiblePartyPractitionerRole = createRefactoredPractitionerRole(responsiblePartyAgentPerson)
  const performerPractitionerRole = createRefactoredPractitionerRole(performerAgentPerson)
  const practitionerJobRoleNameSystem = "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
  const practitionerJobRoleCodeSystem = "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleCode"

  const cases = [
    [authorAgentPerson, authorPractitionerRole, practitionerJobRoleNameSystem],
    [responsiblePartyAgentPerson, responsiblePartyPractitionerRole, practitionerJobRoleNameSystem],
    [performerAgentPerson, performerPractitionerRole, practitionerJobRoleCodeSystem]
  ]

  test.each(cases)(
    "identifier has correct sds role profile id",
    (agentPerson: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(practitionerRole.identifier[0].system).toBe("https://fhir.nhs.uk/Id/sds-role-profile-id")
      expect(practitionerRole.identifier[0].value).toBe(agentPerson.id._attributes.extension)
    })

  test.each(cases)(
    "practitioner has identifier and display fields",
    (_: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      expect(isReference(practitionerRole.practitioner)).toBeFalsy()
      const practitioner = practitionerRole.practitioner as fhir.IdentifierReference<fhir.Practitioner>
      expect(practitioner.identifier).toBeDefined()
      expect(practitioner.display).toBeDefined()
    }
  )

  test.each(cases)(
    "HealthcareService has identifier and display fields",
    (_: hl7V3.AgentPerson, practitionerRole: fhir.PractitionerRole) => {
      practitionerRole.healthcareService.forEach(healthcareService => {
        expect(isReference(healthcareService)).toBeFalsy()
        const typedHealthCareService = healthcareService as fhir.IdentifierReference<fhir.Practitioner>
        expect(typedHealthCareService.identifier).toBeDefined()
        expect(typedHealthCareService.display).toBeDefined()
      })
    }
  )

  test("organization has identifier and display fields (author only)", () => {
    expect(isReference(authorPractitionerRole.organization)).toBeFalsy()
    const organization = authorPractitionerRole.organization as fhir.IdentifierReference<fhir.Organization>
    expect(organization.identifier).toBeDefined()
    expect(organization.display).toBeDefined()
  }
  )

  test.each(cases)("has correct (JobRoleName) code", (
    agentPerson: hl7V3.AgentPerson,
    practitionerRole: fhir.PractitionerRole,
    practitionerJobRoleNameSystem: string) => {
    expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
    expect(practitionerRole.code[0].coding[0].system).toBe(practitionerJobRoleNameSystem)
  })

  test.each(cases)("has correct (JobRoleCode) code", (
    agentPerson: hl7V3.AgentPerson,
    practitionerRole: fhir.PractitionerRole,
    practitionerJobRoleCodeSystem: string) => {
    expect(practitionerRole.code[0].coding[0].code).toBe(agentPerson.code._attributes.code)
    expect(practitionerRole.code[0].coding[0].system).toBe(practitionerJobRoleCodeSystem)
  })

  test("practitionerRole has correct telecom information", () => {
    expect(authorPractitionerRole.telecom[0].system).toBe("phone")
    expect(authorPractitionerRole.telecom[0].use).toBe("work")
    expect(authorPractitionerRole.telecom[0].value).toBe("01234567890")
  })

  test("performerParticipantPractitionerRole has correct telecom information", () => {
    expect(performerPractitionerRole.telecom).toBeUndefined()
  })
})
