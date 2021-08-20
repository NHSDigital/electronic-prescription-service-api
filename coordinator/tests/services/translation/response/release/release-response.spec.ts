import {
  createBundleResources,
  createInnerBundle,
  createOuterBundle
} from "../../../../../src/services/translation/response/release/release-response"
import {readXmlStripNamespace} from "../../../../../src/services/serialisation/xml"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"
import {getUniqueValues} from "../../../../../src/utils/collections"
import {resolveOrganization, resolvePractitioner, toArray} from "../../../../../src/services/translation/common"
import {hl7V3} from "@models"
import {
  getHealthcareServices,
  getLocations,
  getOrganizations,
  getPractitionerRoles,
  getPractitioners
} from "../../../../../src/services/translation/common/getResourcesOfType"
import {getRequester, getResponsiblePractitioner} from "../common.spec"

describe("outer bundle", () => {
  const result = createOuterBundle(getExamplePrescriptionReleaseResponse())
  console.log(LosslessJson.stringify(result))

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2013-12-10T17:22:07+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "285e5cce-8bc8-a7be-6b05-675051da69b0"
    })
  })

  test("contains type with correct value", () => {
    expect(result.type).toEqual("searchset")
  })

  test("contains total with correct value", () => {
    expect(result.total).toEqual(1)
  })

  test("contains entry containing only bundles", () => {
    const resourceTypes = result.entry.map(entry => entry.resource.resourceType)
    expect(getUniqueValues(resourceTypes)).toEqual(["Bundle"])
  })

  describe("when the release response message contains only old format prescriptions", () => {
    const examplePrescriptionReleaseResponse = getExamplePrescriptionReleaseResponse()
    toArray(examplePrescriptionReleaseResponse.component)
      .forEach(component => component.templateId._attributes.extension = "PORX_MT122003UK30")
    const result = createOuterBundle(examplePrescriptionReleaseResponse)

    test("contains total with correct value", () => {
      expect(result.total).toEqual(0)
    })

    test("contains entry which is empty", () => {
      expect(result.entry).toHaveLength(0)
    })
  })
})

describe("inner bundle", () => {
  const result = createInnerBundle(getExampleParentPrescription(), "ReleaseRequestId")
  console.log(LosslessJson.stringify(result))

  test("contains id", () => {
    expect(result.id).toBeTruthy()
  })

  test("contains meta with correct value", () => {
    expect(result.meta).toEqual({
      lastUpdated: "2013-11-21T12:11:00+00:00"
    })
  })

  test("contains identifier with correct value", () => {
    expect(result.identifier).toEqual({
      system: "https://tools.ietf.org/html/rfc4122",
      value: "83df678d-daa5-1a24-9776-14806d837ca7"
    })
  })

  test("contains type with correct value", () => {
    expect(result.type).toEqual("message")
  })

  test("contains entry", () => {
    expect(result.entry.length).toBeGreaterThan(0)
  })
})

describe("bundle resources", () => {
  const result = createBundleResources(getExampleParentPrescription(), "ReleaseRequestId")
  console.log(LosslessJson.stringify(result))

  test("contains MessageHeader", () => {
    const messageHeader = result.filter(resource => resource.resourceType === "MessageHeader")
    expect(messageHeader).toHaveLength(1)
  })

  test("first element is MessageHeader", () => {
    expect(result[0].resourceType).toEqual("MessageHeader")
  })

  test("contains Patient", () => {
    const patients = result.filter(resource => resource.resourceType === "Patient")
    expect(patients).toHaveLength(1)
  })

  test("contains PractitionerRole", () => {
    const practitionerRoles = result.filter(resource => resource.resourceType === "PractitionerRole")
    expect(practitionerRoles).toHaveLength(1)
  })

  test("contains Practitioner", () => {
    const practitioners = result.filter(resource => resource.resourceType === "Practitioner")
    expect(practitioners).toHaveLength(1)
  })

  test("contains HealthcareService", () => {
    const healthcareServices = result.filter(resource => resource.resourceType === "HealthcareService")
    expect(healthcareServices).toHaveLength(1)
  })

  test("contains Location", () => {
    const locations = result.filter(resource => resource.resourceType === "Location")
    expect(locations).toHaveLength(1)
  })

  test("contains Organization", () => {
    const organizations = result.filter(resource => resource.resourceType === "Organization")
    expect(organizations).toHaveLength(1)
  })

  test("contains MedicationRequests", () => {
    const medicationRequest = result.filter(resource => resource.resourceType === "MedicationRequest")
    expect(medicationRequest).toHaveLength(4)
  })

  test("contains Provenance", () => {
    const provenances = result.filter(resource => resource.resourceType === "Provenance")
    expect(provenances).toHaveLength(1)
  })
})

describe("practitioner details", () => {
  describe("when author and responsible party are different people or roles", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "AuthorRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "AuthorJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "AuthorProfessionalCode"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "ResponsiblePartyRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "ResponsiblePartyJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ResponsiblePartyProfessionalCode"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("two PractitionerRoles present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(2)
    })
    test("requester PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "AuthorRoleProfileId"
      }])
    })
    test("requester PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "AuthorJobRoleCode"
        }]
      }])
    })
    test("responsible practitioner PractitionerRole contains correct identifiers", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerIdentifiers = responsiblePractitioner.identifier
      expect(responsiblePractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "ResponsiblePartyRoleProfileId"
      }])
    })

    test("requester PractitionerRole contains correct codes", () => {
      const responsiblePractitioner = getResponsiblePractitioner(result)
      const responsiblePractitionerCodes = responsiblePractitioner.code
      expect(responsiblePractitionerCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "ResponsiblePartyJobRoleCode"
        }]
      }])
    })

    test("two Practitioners present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(2)
    })
    test("requester Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "AuthorProfessionalCode"
      }])
    })
    test("responsible practitioner Practitioner contains correct identifiers", () => {
      const respPracPractitionerRole = getResponsiblePractitioner(result)
      const respPracPractitioner = resolvePractitioner(result, respPracPractitionerRole.practitioner)
      const respPracPractitionerIdentifiers = respPracPractitioner.identifier
      expect(respPracPractitionerIdentifiers).toMatchObject([{
        system: "https://fhir.hl7.org.uk/Id/professional-code",
        value: "ResponsiblePartyProfessionalCode"
      }])
    })

    test("two HealthcareServices present", () => {
      const healthcareServices = getHealthcareServices(result)
      expect(healthcareServices).toHaveLength(2)
    })
    test("two Locations present", () => {
      const locations = getLocations(result)
      expect(locations).toHaveLength(2)
    })

    test("one Organization present", () => {
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(1)
    })
    test("requester Organization contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "5AW"
      }])
    })
  })

  describe("when author and responsible party are the same person and role", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode1"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "ProfessionalCode2"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("one PractitionerRole present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
        value: "CommonRoleProfileId"
      }])
    })
    test("PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })

    test("one Practitioner present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([
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

    test("one HealthcareService present", () => {
      const healthcareServices = getHealthcareServices(result)
      expect(healthcareServices).toHaveLength(1)
    })
    test("one Location present", () => {
      const locations = getLocations(result)
      expect(locations).toHaveLength(1)
    })

    test("one Organization present", () => {
      const organizations = getOrganizations(result)
      expect(organizations).toHaveLength(1)
    })
    test("Organization contains correct identifiers", () => {
      const requester = getRequester(result)
      const requesterOrganization = resolveOrganization(result, requester)
      const requesterOrganizationIdentifiers = requesterOrganization.identifier
      expect(requesterOrganizationIdentifiers).toMatchObject([{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "5AW"
      }])
    })
  })

  describe("when responsible party contains a spurious code", () => {
    const parentPrescription = getExampleParentPrescription()
    const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
    prescription.author.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.author.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.author.AgentPerson.agentPerson.id._attributes.extension = "G1234567"
    prescription.responsibleParty.AgentPerson.id._attributes.extension = "CommonRoleProfileId"
    prescription.responsibleParty.AgentPerson.code._attributes.code = "CommonJobRoleCode"
    prescription.responsibleParty.AgentPerson.agentPerson.id._attributes.extension = "G7123456"

    const result = createInnerBundle(parentPrescription, "ReleaseRequestId")

    test("one PractitionerRole present", () => {
      const practitionerRoles = getPractitionerRoles(result)
      expect(practitionerRoles).toHaveLength(1)
    })
    test("PractitionerRole contains correct identifiers (including spurious code)", () => {
      const requester = getRequester(result)
      const requesterIdentifiers = requester.identifier
      expect(requesterIdentifiers).toMatchObject([
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "CommonRoleProfileId"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
          value: "G7123456"
        }
      ])
    })
    test("PractitionerRole contains correct codes", () => {
      const requester = getRequester(result)
      const requesterCodes = requester.code
      expect(requesterCodes).toMatchObject([{
        coding: [{
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "CommonJobRoleCode"
        }]
      }])
    })

    test("one Practitioner present", () => {
      const practitioners = getPractitioners(result)
      expect(practitioners).toHaveLength(1)
    })
    test("Practitioner contains correct identifiers (no spurious code)", () => {
      const requesterPractitionerRole = getRequester(result)
      const requesterPractitioner = resolvePractitioner(result, requesterPractitionerRole.practitioner)
      const requesterPractitionerIdentifiers = requesterPractitioner.identifier
      expect(requesterPractitionerIdentifiers).toMatchObject([
        {
          system: "https://fhir.hl7.org.uk/Id/gmp-number",
          value: "G1234567"
        }
      ])
    })
  })
})

export function getExamplePrescriptionReleaseResponse(): hl7V3.PrescriptionReleaseResponse {
  const exampleStr = fs.readFileSync(path.join(__dirname, "release_success.xml"), "utf8")
  const exampleObj = readXmlStripNamespace(exampleStr)
  return exampleObj.PORX_IN070101UK31.ControlActEvent.subject.PrescriptionReleaseResponse
}

function getExampleParentPrescription(): hl7V3.ParentPrescription {
  return toArray(getExamplePrescriptionReleaseResponse().component)[0].ParentPrescription
}
