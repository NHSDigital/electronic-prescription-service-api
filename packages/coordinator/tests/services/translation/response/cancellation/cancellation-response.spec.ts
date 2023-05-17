import * as TestResources from "../../../../resources/test-resources"
import {
  translateSpineCancelResponseIntoBundle,
  translateSpineCancelResponseIntoOperationOutcome
} from "../../../../../src/services/translation/response/cancellation/cancellation-response"
import {
  getLocations,
  getMedicationRequests,
  getMessageHeader,
  getOrganizations,
  getPatient,
  getPractitionerRoles,
  getPractitioners
} from "../../../../../src/services/translation/common/getResourcesOfType"
import {getCancellationResponse, hasCorrectISOFormat} from "../../common/test-helpers"
import {CANCEL_RESPONSE_HANDLER} from "../../../../../src/services/translation/response"
import {
  extractStatusCode
} from "../../../../../src/services/translation/response/cancellation/cancellation-medication-request"
import {fhir} from "@models"
import {getPerformer, getRequester, getResponsiblePractitioner} from "../common.spec"
import {resolvePractitioner} from "../../../../../src/services/translation/common"
import {Organization as IOrgansation} from "../../../../../../models/fhir/practitioner-role"

const actualError = TestResources.spineResponses.cancellationNotFoundError
const actualSendMessagePayload = CANCEL_RESPONSE_HANDLER.extractSendMessagePayload(actualError.response.body)
const actualCancelResponse = getCancellationResponse(TestResources.spineResponses.cancellationNotFoundError)
const fhirBundle = translateSpineCancelResponseIntoBundle(actualCancelResponse)
const fhirOperationOutcome = translateSpineCancelResponseIntoOperationOutcome(extractStatusCode(actualCancelResponse))

describe("bundle", () => {
  test("response is a bundle", () => {
    expect(fhirBundle.resourceType).toBe("Bundle")
  })

  test("bundle has type", () => {
    expect(fhirBundle.type).toBe("message")
  })

  test("bundle has identifier", () => {
    const bundleIdentifier = fhirBundle.identifier
    expect(bundleIdentifier.system).toBe("https://tools.ietf.org/html/rfc4122")
    expect(bundleIdentifier.value)
      .toBe(actualSendMessagePayload.id._attributes.root.toLowerCase())
  })

  test("bundle has correct timestamp format", () => {
    expect(hasCorrectISOFormat(fhirBundle.timestamp)).toBe(true)
  })
})

describe("bundle entries", () => {
  test("bundle contains entries", () => {
    expect(fhirBundle.entry.length).toBeGreaterThan(0)
  })

  test("entries contains a MessageHeader", () => {
    expect(() => getMessageHeader(fhirBundle)).not.toThrow()
  })

  test("the first entry is a MessageHeader", () => {
    expect(fhirBundle.entry[0].resource.resourceType).toBe("MessageHeader")
  })

  test("response bundle entries contains a Patient", () => {
    expect(() => getPatient(fhirBundle)).not.toThrow()
  })

  test("entries contains two Practitioner", () => {
    expect(getPractitioners(fhirBundle)).toHaveLength(2)
  })

  test("entries contains no Locations", () => {
    expect(getLocations(fhirBundle)).toHaveLength(0)
  })

  test("entries contains two PractitionerRole", () => {
    expect(getPractitionerRoles(fhirBundle)).toHaveLength(2)
  })

  test("entries contains a MedicationRequest (without dispenseRequest)", () => {
    const medicationRequests = getMedicationRequests(fhirBundle)
    expect(medicationRequests.length).toEqual(1)
    expect(medicationRequests[0].dispenseRequest).toBeUndefined()
  })

  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const performerFhirBundle = translateSpineCancelResponseIntoBundle(cancellationErrorDispensedResponse)

  test("performer field in hl7 message adds performer practitioner", () => {
    const practitioners = getPractitioners(performerFhirBundle)
    const nameArray = practitioners.map(practitioner => practitioner.name[0].text)
    expect(nameArray).toContain("Taylor Paul")
  })

  test("performer field in hl7 message adds performer practitionerRole", () => {
    const practitionerRoles = getPractitionerRoles(performerFhirBundle)
    const codeArray = practitionerRoles.map(practitionerRole => practitionerRole.code[0].coding[0].code)
    expect(codeArray).toContain("S8003:G8003:R8003")
  })

  test("performer field in hl7 message adds performer organization", () => {
    const organizations = getOrganizations(performerFhirBundle)
    const postcodes = organizations.flatMap(organization => organization.address.map(a => a.postalCode))
    expect(postcodes).toContain("PR26 7QN")
  })

  test("organisation should not contain a type field", () => {
    const organisations = getOrganizations(performerFhirBundle)
    const organisation: IOrgansation = organisations[0]
    expect(organisation.type).toBeUndefined()
  })

  test("performer field in hl7 message adds dispense reference to MedicationRequest", () => {
    expect(getMedicationRequests(performerFhirBundle)[0].dispenseRequest).toBeDefined()
  })

  test("entries are not duplicated", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.performer.AgentPerson.id = dispenseError.author.AgentPerson.id
    dispenseError.responsibleParty.AgentPerson.id = dispenseError.author.AgentPerson.id
    const translatedDispenseBundle = translateSpineCancelResponseIntoBundle(dispenseError)
    expect(getPractitioners(translatedDispenseBundle)).toHaveLength(1)
    expect(getPractitionerRoles(translatedDispenseBundle)).toHaveLength(1)
    expect(getOrganizations(translatedDispenseBundle)).toHaveLength(1)
  })
})

describe("practitioner details", () => {
  describe("when author, responsible party and performer are different people or roles", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.author.AgentPerson.id._attributes.extension = "AuthorRoleProfileId"
    dispenseError.author.AgentPerson.code._attributes.code = "AuthorJobRoleCode"
    dispenseError.author.AgentPerson.agentPerson.id._attributes.extension = "AuthorProfessionalCode"
    dispenseError.responsibleParty.AgentPerson.id._attributes.extension = "ResponsiblePartyRoleProfileId"
    dispenseError.responsibleParty.AgentPerson.code._attributes.code = "ResponsiblePartyJobRoleCode"
    dispenseError.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ResponsiblePartyProfessionalCode"
    dispenseError.performer.AgentPerson.id._attributes.extension = "PerformerRoleProfileId"
    dispenseError.performer.AgentPerson.code._attributes.code = "PerformerJobRoleCode"
    dispenseError.performer.AgentPerson.agentPerson.id._attributes.extension = "PerformerProfessionalCode"
    const bundle = translateSpineCancelResponseIntoBundle(dispenseError)

    test("three PractitionerRoles present", () => {
      expect(getPractitionerRoles(bundle)).toHaveLength(3)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(bundle)
      expect(requester.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "ResponsiblePartyRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(bundle)
      expect(requester.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "ResponsiblePartyJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "AuthorRoleProfileId"
      }])
    })
    test("responsible practitioner PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "AuthorJobRoleCode"
        }]
      }])
    })
    test("performer PractitionerRole contains correct identifiers", () => {
      const performer = getPerformer(bundle)
      expect(performer.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "PerformerRoleProfileId"
      }])
    })
    test("performer PractitionerRole contains correct codes", () => {
      const performer = getPerformer(bundle)
      expect(performer.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "PerformerJobRoleCode"
        }]
      }])
    })

    test("three Practitioners present", () => {
      const practitioners = getPractitioners(bundle)
      expect(practitioners).toHaveLength(3)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(bundle)
      const requesterPractitioner = resolvePractitioner(bundle, requesterPractitionerRole.practitioner)
      expect(requesterPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "ResponsiblePartyProfessionalCode"
      }])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(bundle)
      const respPracPractitioner = resolvePractitioner(bundle, respPracPractitionerRole.practitioner)
      expect(respPracPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "AuthorProfessionalCode"
      }])
    })
    test("performer Practitioner contains correct identifiers", () => {
      const performerPractitionerRole = getPerformer(bundle)
      const performerPractitioner = resolvePractitioner(bundle, performerPractitionerRole.practitioner)
      expect(performerPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "PerformerProfessionalCode"
      }])
    })
  })

  describe("when author and responsible party are the same person and role", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.author.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    dispenseError.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"
    dispenseError.performer.AgentPerson.id._attributes.extension = "PerformerRoleProfileId"
    dispenseError.performer.AgentPerson.code._attributes.code = "PerformerJobRoleCode"
    dispenseError.performer.AgentPerson.agentPerson.id._attributes.extension = "PerformerProfessionalCode"
    const bundle = translateSpineCancelResponseIntoBundle(dispenseError)

    test("two PractitionerRoles present", () => {
      expect(getPractitionerRoles(bundle)).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(bundle)
      expect(requester.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "CommonRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(bundle)
      expect(requester.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner is the same as requester", () => {
      const requester = getRequester(bundle)
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner).toBe(requester)
    })
    test("performer PractitionerRole contains correct identifiers", () => {
      const performer = getPerformer(bundle)
      expect(performer.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "PerformerRoleProfileId"
      }])
    })
    test("performer PractitionerRole contains correct codes", () => {
      const performer = getPerformer(bundle)
      expect(performer.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "PerformerJobRoleCode"
        }]
      }])
    })

    test("two Practitioners present", () => {
      const practitioners = getPractitioners(bundle)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(bundle)
      const requesterPractitioner = resolvePractitioner(bundle, requesterPractitionerRole.practitioner)
      expect(requesterPractitioner.identifier).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode1"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode2"
        }
      ])
    })
    test("performer Practitioner contains correct identifiers", () => {
      const performerPractitionerRole = getPerformer(bundle)
      const performerPractitioner = resolvePractitioner(bundle, performerPractitionerRole.practitioner)
      expect(performerPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "PerformerProfessionalCode"
      }])
    })
  })

  describe("when author and performer are the same person and role", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.author.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    dispenseError.responsibleParty.AgentPerson.id._attributes.extension = "ResponsiblePartyRoleProfileId"
    dispenseError.responsibleParty.AgentPerson.code._attributes.code = "ResponsiblePartyJobRoleCode"
    dispenseError.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ResponsiblePartyProfessionalCode"
    dispenseError.performer.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.performer.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.performer.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"
    const bundle = translateSpineCancelResponseIntoBundle(dispenseError)

    test("two PractitionerRoles present", () => {
      expect(getPractitionerRoles(bundle)).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(bundle)
      expect(requester.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "ResponsiblePartyRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(bundle)
      expect(requester.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "ResponsiblePartyJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "CommonRoleProfileId"
      }])
    })
    test("responsible practitioner PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "CommonJobRoleCode"
        }]
      }])
    })
    test("performer is the same as responsible practitioner", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      const performer = getPerformer(bundle)
      expect(performer).toBe(responsiblePractitioner)
    })

    test("two Practitioners present", () => {
      const practitioners = getPractitioners(bundle)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(bundle)
      const requesterPractitioner = resolvePractitioner(bundle, requesterPractitionerRole.practitioner)
      expect(requesterPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "ResponsiblePartyProfessionalCode"
      }])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(bundle)
      const respPracPractitioner = resolvePractitioner(bundle, respPracPractitionerRole.practitioner)
      expect(respPracPractitioner.identifier).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          value: "ProfessionalCode1"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode2"
        }
      ])
    })
  })

  describe("when responsible party and performer are the same person and role", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.author.AgentPerson.id._attributes.extension = "AuthorRoleProfileId"
    dispenseError.author.AgentPerson.code._attributes.code = "AuthorJobRoleCode"
    dispenseError.author.AgentPerson.agentPerson.id._attributes.extension = "AuthorProfessionalCode"
    dispenseError.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    dispenseError.performer.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.performer.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.performer.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"
    const bundle = translateSpineCancelResponseIntoBundle(dispenseError)

    test("two PractitionerRoles present", () => {
      expect(getPractitionerRoles(bundle)).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(bundle)
      expect(requester.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "CommonRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(bundle)
      expect(requester.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "CommonJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "AuthorRoleProfileId"
      }])
    })
    test("responsible practitioner PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          code: "AuthorJobRoleCode"
        }]
      }])
    })
    test("performer is the same as requester", () => {
      const requester = getRequester(bundle)
      const performer = getPerformer(bundle)
      expect(performer).toBe(requester)
    })

    test("two Practitioners present", () => {
      const practitioners = getPractitioners(bundle)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(bundle)
      const requesterPractitioner = resolvePractitioner(bundle, requesterPractitionerRole.practitioner)
      expect(requesterPractitioner.identifier).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
          value: "ProfessionalCode1"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode2"
        }
      ])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(bundle)
      const respPracPractitioner = resolvePractitioner(bundle, respPracPractitionerRole.practitioner)
      expect(respPracPractitioner.identifier).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        //Note: Responsible practitioner in FHIR is not the same as responsible party in HL7 V3
        value: "AuthorProfessionalCode"
      }])
    })
  })

  describe("when author, responsible party and performer are the same person and role", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.author.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    dispenseError.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"
    dispenseError.performer.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    dispenseError.performer.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    dispenseError.performer.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode3"
    const bundle = translateSpineCancelResponseIntoBundle(dispenseError)

    test("one PractitionerRole present", () => {
      expect(getPractitionerRoles(bundle)).toHaveLength(1)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(bundle)
      expect(requester.identifier).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "CommonRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(bundle)
      expect(requester.code).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner is the same as requester", () => {
      const requester = getRequester(bundle)
      const responsiblePractitioner = getResponsiblePractitioner(bundle)
      expect(responsiblePractitioner).toBe(requester)
    })
    test("performer is the same as requester", () => {
      const requester = getRequester(bundle)
      const performer = getPerformer(bundle)
      expect(performer).toBe(requester)
    })

    test("one Practitioner present", () => {
      const practitioners = getPractitioners(bundle)
      expect(practitioners).toHaveLength(1)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(bundle)
      const requesterPractitioner = resolvePractitioner(bundle, requesterPractitionerRole.practitioner)
      expect(requesterPractitioner.identifier).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode1"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode2"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "ProfessionalCode3"
        }
      ])
    })
  })
})

describe("operationOutcome", () => {
  test("response is a operationOutcome", () => {
    expect(fhirOperationOutcome.resourceType).toBe("OperationOutcome")
  })

  test("response is a operationOutcome", () => {
    expect(fhirOperationOutcome.issue).toHaveLength(1)
    expect(fhirOperationOutcome.issue[0]).toMatchObject({
      severity: "error",
      code: fhir.IssueCodes.NOT_FOUND,
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history",
          code: "R-0008",
          display: "Prescription/item not found"
        }]
      }
    })
  })
})
